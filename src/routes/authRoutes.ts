import { ClearAllTokenController, ListAllTokenController, LoginController, LogoutController } from '@/controllers/AuthController'
import { authMiddleware } from '@/middleware/authMiddleware'
import express from 'express'

const authRouter = express.Router()

// generate token
authRouter.post('/login', LoginController)
// revoke token
authRouter.post('/logout', authMiddleware, LogoutController)
authRouter.get('/tokens', authMiddleware, ListAllTokenController)
authRouter.post('/clear-tokens', authMiddleware, ClearAllTokenController)

export default authRouter
