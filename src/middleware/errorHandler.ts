import { logger } from '@/logger'
import { DrizzleError } from 'drizzle-orm'
import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'

export default function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  const isZodError = err instanceof ZodError
  const isDrizzleError = err instanceof DrizzleError
  const statusCode = isZodError || isDrizzleError ? 400 : 500
  const message = isZodError ? fromError(err).toString() : err.message
  const isProd = process.env.NODE_ENV === 'production'
  const stack = isProd ? undefined : isZodError ? err.stack : err.stack
  logger.error(err)
  res.status(statusCode).json({ message, stack })
}
