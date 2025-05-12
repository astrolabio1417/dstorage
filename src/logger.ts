import pino from 'pino'

// Set up the logger
export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info', // Default log level
    transport: {
      options: {
        colorize: true, // Add colors to the logs
      },
      target: 'pino-pretty', // Pretty logs in dev
    },
  },
  pino.destination('./app.log'),
)
