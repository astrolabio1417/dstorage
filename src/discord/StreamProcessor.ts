import { Transform, TransformCallback } from 'stream'

type IStreamProcessor = (chunk: Buffer, index: number) => Promise<void>

class StreamProcessor extends Transform {
  index: number
  processor: IStreamProcessor

  constructor(processor: IStreamProcessor) {
    super()
    this.processor = processor
    this.index = 0
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    this.processor(chunk, this.index)
      .then(() => {
        callback(null)
      })
      .catch(callback)
    this.index += 1
  }
}

export default StreamProcessor
