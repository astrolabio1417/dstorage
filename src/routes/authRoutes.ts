import { LoginController, LogoutController } from '@/controllers/AuthController'
import { authMiddleware } from '@/middleware/authMiddleware'
import express from 'express'

const authRouter = express.Router()

authRouter.post('/login', LoginController)
authRouter.post('/logout', authMiddleware, LogoutController)

export default authRouter
