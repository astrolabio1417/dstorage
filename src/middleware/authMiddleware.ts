import { authTokens } from '@/token'
import { asyncWrapper } from '@/utils'

export const authMiddleware = asyncWrapper((req, res, next) => {
  const authKey = req.headers.authorization

  if (!authKey || !authTokens.has(authKey)) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  next()
})
