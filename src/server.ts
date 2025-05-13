import 'dotenv/config'
import bodyParser from 'body-parser'
import express from 'express'
import pino from 'pino-http'

import { logger } from './logger'
import errorHandlerMiddleware from './middleware/errorHandler'
import authRouter from './routes/authRoutes'
import nodeRouter from './routes/nodeRoutes'

const port = 3000
const app = express()

app.use(pino({ logger }))
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile('public/index.html')
})

app.use('/api/nodes', nodeRouter)
app.use('/api/auth', authRouter)

app.use(errorHandlerMiddleware)

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port.toString()}`)
})
