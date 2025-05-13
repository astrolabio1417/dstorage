import { logger } from '@/logger'
import { RawFile, REST } from '@discordjs/rest'
import fetch, { HeadersInit } from 'node-fetch'
import Stream, { PassThrough } from 'node:stream'
import pipe, { pipeline } from 'pipeline-pipe'

import { DCRestAttachmentResponse, DiscordFileOptions, IDiscordFile, IDiscordRefreshUrlResponse } from './interfaces'
import StreamBuffer from './StreamBuffer'
const MAX_CHUNK_SIZE = 10165824
const MAX_PARALLEL = 3

const DISCORD_REFRESH_API = 'https://discord.com/api/v9/attachments/refresh-urls'

class DiscordFile {
  authorization: string
  maxChunkSize: number
  maxErrors: number
  maxParallel: number
  rest: REST
  webhookIndex: number
  webhooks: string[]

  get getWebhookUrl() {
    const webhookUrl = this.webhooks[this.webhookIndex]
    this.webhookIndex = (this.webhookIndex + 1) % this.webhooks.length

    return webhookUrl.replace('https://discord.com/api', '') as `/${string}`
  }

  constructor(options: DiscordFileOptions) {
    if (!options.webhooks.length) {
      throw new Error('WEBHOOKS is required!')
    }

    if (!options.authorization) {
      throw new Error('AUTHORIZATION is required!')
    }

    this.webhooks = options.webhooks
    this.webhookIndex = 0
    this.rest = new REST({ timeout: 120000, version: '10' })
    this.maxChunkSize = options.maxChunkSize ?? MAX_CHUNK_SIZE
    this.maxParallel = options.maxParallel ?? MAX_PARALLEL
    this.maxErrors = 2
    this.authorization = options.authorization
  }

  async _upload(files: RawFile[], signal?: AbortSignal) {
    return (await this.rest.post(this.getWebhookUrl, {
      auth: false,
      files,
      signal,
    })) as Promise<DCRestAttachmentResponse>
  }

  async fileStream(
    passThroughStream: PassThrough,
    files: IDiscordFile[],
    startRange = 0,
    endRange = 0,
    onFileUpdated?: (response: IDiscordRefreshUrlResponse) => Promise<void>,
  ) {
    function inRange(pos: number, start: number, end: number) {
      return pos >= start && pos <= end
    }

    let errors = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      logger.debug(file)

      if (endRange && file.startRange > endRange) {
        logger.debug(`stream end file.startRange ${file.startRange.toString()} > endRange ${endRange.toString()}`)
        break
      }

      if (startRange > file.endRange) {
        logger.debug(`move to next part file.startRange ${file.startRange.toString()} > startRange ${startRange.toString()}`)
        continue
      }

      const startInRange = inRange(startRange, file.startRange, file.endRange)
      const endInRange = endRange ? inRange(endRange, file.startRange, file.endRange) : false

      const byteStart = startInRange ? startRange - file.startRange : 0
      const byteEnd = endInRange ? file.endRange - endRange || '' : ''

      const headers: HeadersInit = {
        range: `bytes=${byteStart.toString()}-${byteEnd ? byteEnd.toString() : ''}`,
      }

      logger.debug({
        byteEnd,
        byteStart,
        endInRange,
        endRange,
        fileEnd: file.endRange,
        fileSize: file.size,
        fileStart: file.startRange,
        headers,
        startInRange,
        startRange,
      })

      try {
        const res = await fetch(file.url, { headers })

        if (res.status === 404) {
          const oldFiles = files.map((f) => f.url)
          logger.info(`Refreshing node files url ${oldFiles.join(', ')}`)
          const newFiles = await this.refreshFiles(oldFiles)

          if (!newFiles.refreshed_urls.length) throw new Error('Refresh files returns empty list!')

          onFileUpdated?.(newFiles).catch((e: unknown) => {
            logger.error(e, 'onFileUpdated Error')
          })

          for (const newFile of newFiles.refreshed_urls) {
            const oldFileIndex = files.findIndex((file) => file.url === newFile.original)
            if (oldFileIndex === -1) throw new Error('Cannot find original file!')
            files[oldFileIndex].url = newFile.refreshed
          }

          throw new Error(`Failed to fetch: 404 file not found or expired | ${res.url}`)
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status.toString()} | ${res.url}`)
        }

        if (!res.body) {
          throw new Error(`Body returns null: ${res.status.toString()} | ${res.url}`)
        }

        // await pipeline(res.body, passThroughStream, { end: false })

        await new Promise<void>((resolve, reject) => {
          passThroughStream.on('error', reject)

          if (!res.body) {
            reject(new Error('empty response body'))
            return
          }

          res.body.on('error', reject)
          res.body.on('end', () => {
            resolve()
          })
          res.body.pipe(passThroughStream, { end: false })
        })

        errors = 0
      } catch (err) {
        errors += 1
        logger.error(err)
        logger.debug(`errors ${errors.toString()} >= ${this.maxErrors.toString()} max errors | Error on streaming the file ${file.filename}`)

        if (errors >= this.maxErrors) {
          passThroughStream.end()
          throw err
        }

        i -= 1
        logger.debug(`trying to fetch again!`)
      }
    }

    passThroughStream.end()
    return
  }

  async refreshFiles(urls: string[]) {
    const res = await fetch(DISCORD_REFRESH_API, {
      body: JSON.stringify({ attachment_urls: urls }),
      headers: { Authorization: this.authorization, 'content-type': 'application/json' },
      method: 'post',
    })
    const data = await res.json()
    return data as IDiscordRefreshUrlResponse
  }

  async streamUpload(stream: Stream.Readable, originalname: string, signal?: AbortSignal) {
    const files: IDiscordFile[] = []
    let index = 0

    const processChunk = async (chunk: Buffer) => {
      const number = index
      index += 1
      const filename = `${number.toString()}-${originalname}`
      logger.debug('uploading ' + filename)
      const {
        attachments: [attachment],
      } = await this._upload([{ data: chunk, name: filename }], signal)
      logger.debug('upload complete ' + filename)
      const startRange = this.maxChunkSize * number
      const endRange = startRange + attachment.size - 1
      const data: IDiscordFile = {
        endRange,
        filename,
        size: attachment.size,
        startRange,
        url: attachment.url,
      }

      files.push(data)

      return data
    }

    await pipeline(
      stream,
      new StreamBuffer(this.maxChunkSize),
      pipe(
        async (data: Buffer) => {
          await processChunk(data)
          return data
        },
        { maxParallel: this.maxParallel, objectMode: false, ordered: true, signal },
      ),
    )

    return files
  }

  async upload(file: Express.Multer.File, signal?: AbortSignal) {
    return await this.streamUpload(file.stream, file.originalname, signal)
  }
}

export const discordFile = new DiscordFile({
  authorization: process.env.AUTHORIZATION ?? '',
  webhooks: process.env.WEBHOOKS?.split(',') ?? [],
})

export default DiscordFile
