import { LoginPasswordSchema } from '@/schemas/AuthSchemas'
import { ADMIN_PASSWORD, authTokens } from '@/token'
import { asyncWrapper, generateToken } from '@/utils'

// TODO: db token later
export const LoginController = asyncWrapper(async (req, res) => {
  const { password } = await LoginPasswordSchema.parseAsync(req.body)

  if (password !== ADMIN_PASSWORD) {
    res.status(400).json({ message: 'You have entered an invalid password' })
    return
  }

  authTokens.clear()
  const newToken = generateToken()
  authTokens.add(newToken)
  res.json({ token: newToken })
})

export const LogoutController = asyncWrapper((req, res) => {
  const authKey = req.headers.authorization

  if (authTokens.has(authKey)) {
    authTokens.delete(authKey)
  }

  res.json({ message: 'ok' })
})
