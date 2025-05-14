import 'dotenv/config'
import { logger } from '@/logger'
import errorHandlerMiddleware from '@/middleware/errorHandler'
import authRouter from '@/routes/authRoutes'
import nodeRouter from '@/routes/nodeRoutes'
import bodyParser from 'body-parser'
import express from 'express'
import path from 'path'
import pino from 'pino-http'

const port = 3000
const app = express()

app.use(pino({ logger }))
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/video', (_, res) => {
  res.sendFile(path.join(__dirname, '../public/video.html'))
})

app.get('/login', (_, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'))
})

app.use('/api/nodes', nodeRouter)
app.use('/api/auth', authRouter)

app.use(errorHandlerMiddleware)

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port.toString()}`)
})
