import { NextFunction, Request, RequestHandler, Response } from 'express'

export const asyncWrapper = (controller: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next)
    } catch (e) {
      next(e)
    }
  }
}

export const parseRange = (headerRange: string, defaultEnd: number): [number, number] => {
  if (!headerRange.startsWith('bytes=')) return [0, defaultEnd]

  const split = headerRange.replace('bytes=', '').split('-')
  const start = parseInt(split[0])
  const end = /^[0-9]+$/.test(split[1]) ? parseInt(split[1]) : defaultEnd

  return [start, end]
}

const formatMemoryUsage = (data: number) => `${(Math.round((data / 1024 / 1024) * 100) / 100).toString()} MB`

export const getMemoryUsage = () => {
  const memoryData = process.memoryUsage()

  const memoryUsage = {
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
    heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
    heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
    rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
  }

  return memoryUsage
}
