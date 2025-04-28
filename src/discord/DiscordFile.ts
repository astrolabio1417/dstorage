import { RawFile, REST } from '@discordjs/rest'
import fetch, { HeadersInit } from 'node-fetch'
import { PassThrough, pipeline, TransformCallback } from 'node:stream'
import { promisify } from 'node:util'
import transform from 'parallel-transform'

import { DCRestAttachmentResponse, DiscordFileOptions, IDiscordFile } from './interfaces'
import StreamBuffer from './StreamBuffer'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DISCORD_API = 'https://discord.com/api'
const MAX_CHUNK_SIZE = 10165824
const MAX_PARALLEL = 3

const streamPipeline = promisify(pipeline)

class DiscordFile {
  maxChunkSize: number
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
      throw new Error('Webhook URL is required!')
    }

    this.webhooks = options.webhooks
    this.webhookIndex = 0
    this.rest = new REST({ timeout: 120000, version: '10' })
    this.maxChunkSize = options.maxChunkSize ?? MAX_CHUNK_SIZE
    this.maxParallel = options.maxParallel ?? MAX_PARALLEL
  }

  async _upload(files: RawFile[]) {
    return (await this.rest.post(this.getWebhookUrl, {
      auth: false,
      files,
    })) as Promise<DCRestAttachmentResponse>
  }

  fileStream(files: IDiscordFile[], startRange = 0, endRange = 0) {
    const passThroughStream = new PassThrough()

    function inRange(pos: number, start: number, end: number) {
      return pos >= start && pos <= end
    }

    async function fetchNextFile(files: IDiscordFile[], index = 0) {
      if (index >= files.length) {
        console.debug('stream end index >= files.length', index, files.length)
        passThroughStream.end()
        return
      }

      const file = files[index]

      if (endRange && file.startRange > endRange) {
        console.debug('stream end file.startRange > endRange', file.startRange, endRange)
        passThroughStream.end()
        return
      }

      if (startRange > file.endRange) {
        console.debug('move to next part', file.startRange, startRange)
        await fetchNextFile(files, index + 1)
        return
      }

      const startInRange = inRange(startRange, file.startRange, file.endRange)
      const endInRange = endRange ? inRange(endRange, file.startRange, file.endRange) : false

      const byteStart = startInRange ? startRange - file.startRange : 0
      const byteEnd = endInRange ? file.endRange - endRange || '' : ''

      const headers: HeadersInit = {
        range: `bytes=${byteStart.toString()}-${byteEnd ? byteEnd.toString() : ''}`,
      }

      console.debug({
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
        // TODO: refresh discord file url if not found?
        const res = await fetch(file.url, {
          headers,
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status.toString()} | ${res.url}`)
        }

        if (!res.body) {
          throw new Error(`Body returns null: ${res.status.toString()} | ${res.url}`)
        }

        await streamPipeline(res.body, new StreamBuffer(1000), passThroughStream, { end: false })
        await fetchNextFile(files, index + 1)
      } catch (err) {
        console.error(err)
      }
    }

    fetchNextFile(files, 0)
      .then()
      .catch((err: unknown) => {
        console.error(err)
      })

    return passThroughStream
  }

  async upload(file: Express.Multer.File) {
    const files: IDiscordFile[] = []
    let index = 0

    const processChunk = async (chunk: Buffer) => {
      const number = index
      index += 1
      const filename = `${number.toString()}-${file.originalname}`
      console.log('uploading ', number)
      const {
        attachments: [attachment],
      } = await this._upload([{ data: chunk, name: filename }])
      console.log('upload complete ', number)
      const startRange = this.maxChunkSize * number
      const endRange = startRange + attachment.size - 1
      const data = {
        endRange,
        filename,
        size: attachment.size,
        startRange,
        url: attachment.url,
      }
      return data
    }

    return await new Promise<IDiscordFile[]>((resolve, reject) => {
      file.stream
        .pipe(new StreamBuffer(this.maxChunkSize))
        .pipe(
          new transform(this.maxParallel, { ordered: true }, (data: Buffer, callback: TransformCallback) => {
            processChunk(data)
              .then((res) => {
                callback(null, res)
              })
              .catch(callback)
          }),
        )
        .on('data', (data: IDiscordFile) => {
          files.push(data)
          console.log({ data })
        })
        .on('end', () => {
          console.log('onfinish | resolved: ', files)
          resolve(files)
        })
        .on('error', reject)
    })
  }
}

export const discordFile = new DiscordFile({
  webhooks: process.env.WEBHOOKS?.split(',') ?? [],
})

export default DiscordFile
