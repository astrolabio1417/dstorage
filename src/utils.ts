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
