import { Node } from 'generated/prisma'

declare global {
  namespace Express {
    interface Request {
      node?: Node
    }
  }
}
