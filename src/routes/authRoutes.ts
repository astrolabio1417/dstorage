import { LoginController } from '@/controllers/AuthController'
import { authMiddleware } from '@/middleware/authMiddleware'
import express from 'express'

const authRouter = express.Router()

authRouter.post('/login', LoginController)
authRouter.post('/logout', authMiddleware, LoginController)

export default authRouter
