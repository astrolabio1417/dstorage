export interface DCRestAttachment {
  content_scan_version: number
  filename: string
  id: number
  proxy_url: string
  size: number
  url: string
}

export interface DCRestAttachmentResponse {
  attachments: DCRestAttachment[]
  channel_id: string
  id: string
  timestamp: string
  webhook_id: string
}

export interface DiscordFileOptions {
  maxChunkSize?: number
  maxParallel?: number
  webhooks: string[]
}

export interface IDiscordFile {
  endRange: number
  filename: string
  size: number
  startRange: number
  url: string
}
