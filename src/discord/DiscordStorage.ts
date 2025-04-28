import { Request } from 'express'
import multer from 'multer'

import { discordFile } from './DiscordFile'
import { IDiscordFile } from './interfaces'

export interface CustomDiscordStorageFileResult extends Partial<Express.Multer.File> {
  discordResult: IDiscordFile[]
}

class DiscordStorage implements multer.StorageEngine {
  _handleFile(req: Request, file: Express.Multer.File, callback: (error?: unknown, info?: CustomDiscordStorageFileResult) => void): void {
    discordFile
      .upload(file)
      .then((data) => {
        callback(null, { ...file, discordResult: data })
      })
      .catch((err: unknown) => {
        callback(err)
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _removeFile(req: Request, file: Express.Multer.File, callback: (error: Error | null) => void): void {
    throw new Error('Method not implemented.')
  }
}

export default DiscordStorage
