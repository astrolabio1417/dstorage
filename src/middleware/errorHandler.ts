import { NextFunction, Request, Response } from 'express'
import { Prisma } from 'generated/prisma'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'

export default function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  console.log('HELLO')
  const isZodError = err instanceof ZodError
  const isPrismaError = err instanceof Prisma.PrismaClientKnownRequestError
  const statusCode = isZodError || isPrismaError ? 400 : 500
  let message = isZodError ? fromError(err).toString() : err.message
  const isProd = process.env.NODE_ENV === 'production'
  const stack = isProd ? undefined : isZodError ? err.stack : err.stack

  if (isPrismaError && err.code === 'P2002') {
    message = 'Duplicate record: unique constraint failed.'
  }

  console.error(err)
  res.status(statusCode).json({ message, stack })
}
