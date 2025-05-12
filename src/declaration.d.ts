import { nodesTable } from './db/schema'

declare global {
  namespace Express {
    interface Request {
      node?: typeof nodesTable.$inferSelect
    }
  }
}
