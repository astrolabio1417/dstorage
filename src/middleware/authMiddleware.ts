import { db } from '@/db'
import { tokensTable } from '@/db/schema'
import { asyncWrapper } from '@/utils'
import { eq } from 'drizzle-orm'

export const authMiddleware = asyncWrapper(async (req, res, next) => {
  const authToken = req.headers.authorization

  if (!authToken) {
    next()
    return
  }

  const tokens = await db.select().from(tokensTable).where(eq(tokensTable.token, authToken))

  if (tokens.length) {
    next()
    return
  }

  res.status(401).json({ message: 'Unauthorized' })
})
