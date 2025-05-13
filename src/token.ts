import { generateToken } from './utils'

export const authTokens = new Set()
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? generateToken()
