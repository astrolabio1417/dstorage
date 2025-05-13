import z from 'zod'

export const LoginPasswordSchema = z.object({ password: z.string() })
