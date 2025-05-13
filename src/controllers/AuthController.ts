import { db } from '@/db'
import { tokensTable } from '@/db/schema'
import { LoginPasswordSchema } from '@/schemas/AuthSchemas'
import { asyncWrapper, generateToken } from '@/utils'
import { desc, eq } from 'drizzle-orm'

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? generateToken()

export const LoginController = asyncWrapper(async (req, res) => {
  const { password } = await LoginPasswordSchema.parseAsync(req.body)

  if (password !== ADMIN_PASSWORD) {
    res.status(400).json({ message: 'You have entered an invalid password' })
    return
  }

  const newToken = generateToken()
  const createdToken = await db.insert(tokensTable).values({ token: newToken }).returning()
  res.json({ createdToken, token: newToken })
})

export const LogoutController = asyncWrapper(async (req, res) => {
  const authKey = req.headers.authorization

  if (!authKey) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const deleted = await db.delete(tokensTable).where(eq(tokensTable.token, authKey)).returning()
  res.json({ deleted })
})

export const ClearAllTokenController = asyncWrapper(async (req, res) => {
  const authKey = req.headers.authorization

  if (!authKey) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const deleted = await db.delete(tokensTable)
  res.json({ deleted })
})

export const ListAllTokenController = asyncWrapper(async (req, res) => {
  const authKey = req.headers.authorization

  if (!authKey) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const tokens = await db.select().from(tokensTable).orderBy(desc(tokensTable.createdAt))
  res.json({ tokens })
})
