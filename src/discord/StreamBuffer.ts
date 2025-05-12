import { Transform, TransformCallback } from 'stream'

class StreamBuffer extends Transform {
  buffer: Buffer
  chunkSize: number
  offset: number

  constructor(chunkSize: number) {
    super()
    this.chunkSize = chunkSize
    this.offset = 0
    this.buffer = Buffer.alloc(chunkSize)
  }

  _flush(callback: TransformCallback) {
    if (this.offset > 0) {
      this.push(this.buffer.subarray(0, this.offset))
    }

    callback()
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
    let position = 0

    while (position < chunk.length) {
      const remaining = this.chunkSize - this.offset
      const toCopy = Math.min(remaining, chunk.length - position)

      chunk.copy(this.buffer, this.offset, position, position + toCopy)
      position += toCopy
      this.offset += toCopy

      if (this.offset >= this.chunkSize) {
        this.push(this.buffer)
        this.buffer = Buffer.alloc(this.chunkSize)
        this.offset = 0
      }
    }

    callback()
  }
}

export default StreamBuffer
