import z from 'zod'

const NodeType = z.enum(['FOLDER', 'FILE'])

export const nodeCreateSchema = z.object({
  name: z.string().min(1),
  parentId: z.coerce.number().min(1).optional(),
  type: NodeType,
})

export const nodeCreateFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.coerce.number().min(1).optional(),
})

export const nodeUploadFilesSchema = z.object({
  parentId: z.coerce.number(),
})

export const nodeUploadFilesValidationSchema = z.object({
  parentId: z.coerce.number().nullish().default(null),
})

export const nodeRetrieveParamsSchema = z.object({ id: z.coerce.number() })

export const nodeListQuerySchema = z.object({ parentId: z.coerce.number().nullish().default(null) })
