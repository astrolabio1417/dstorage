import z from 'zod'

const NodeType = z.enum(['FOLDER', 'FILE'])

export const nodeCreateSchema = z.object({
  name: z.string().min(1),
  parent: z.coerce.number().min(1).nullish().default(null),
  type: NodeType,
})

export const nodeCreateFolderSchema = z.object({
  name: z.string().min(1),
  parent: z.coerce.number().min(1).optional(),
})

export const nodeParentSchema = z.object({
  parent: z.coerce.number().nullish().default(null),
})

export const idSchema = z.object({ id: z.coerce.number() })
