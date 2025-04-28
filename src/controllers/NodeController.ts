import { discordFile } from '@/discord/DiscordFile'
import { CustomDiscordStorageFileResult } from '@/discord/DiscordStorage'
import prisma from '@/prismaClient'
import {
  nodeCreateFolderSchema,
  nodeCreateSchema,
  nodeListQuerySchema,
  nodeRetrieveParamsSchema,
  nodeUploadFilesValidationSchema,
} from '@/schemas/NodeSchemas'
import { asyncWrapper, parseRange } from '@/utils'
import { NodeType, Prisma } from 'generated/prisma'
import mime from 'mime'

const NODE_NOT_FOUND_MESSAGE = 'Node not found!'
const DUPLICATE_ERROR_MESSAGE = 'Duplicate record: unique constraint failed.'

export const nodeValidationController = (type: NodeType | null = null) =>
  asyncWrapper(async (req, res, next) => {
    const parsedParams = nodeRetrieveParamsSchema.parse(req.params)
    const node = await prisma.node.findUnique({
      where: { id: parsedParams.id, ...(type ? { type } : {}) },
    })

    if (!node) {
      res.status(404).json({ message: `Node ${type ? `with a type of ${type} ` : ''}not found!` })
      return
    }

    req.node = node
    next()
  })

export const nodeRetrieveController = asyncWrapper(async (req, res) => {
  if (!req.node) {
    res.status(404).json({ message: NODE_NOT_FOUND_MESSAGE })
    return
  }

  res.json({
    ...req.node,
    fileDataList: await prisma.fileData.findMany({ where: { fieldId: req.node.id } }),
    files: await prisma.node.findMany({
      where: { parentId: req.node.id },
    }),
  })
})

export const nodeCreateFolderController = asyncWrapper(async (req, res) => {
  const parsedBody = await nodeCreateFolderSchema.parseAsync(req.body)
  const node = await prisma.node.findFirst({ where: { ...parsedBody, type: 'FOLDER' } })

  if (node?.id) {
    res.status(400).json({ message: DUPLICATE_ERROR_MESSAGE })
    return
  }

  const data = await prisma.node.create({ data: { ...parsedBody, type: 'FOLDER' } })
  res.json(data)
})

export const nodeUploadFilesController = asyncWrapper(async (req, res) => {
  const parsedBody = await nodeUploadFilesValidationSchema.parseAsync(req.body)
  let node = undefined

  if (parsedBody.parentId) {
    const qNode = await prisma.node.findFirst({ where: { ...parsedBody, type: 'FOLDER' } })

    if (!qNode?.id) {
      res.status(404).json({ message: NODE_NOT_FOUND_MESSAGE })
      // TODO: delete the file from storage if possible
      return
    }

    node = qNode
  }

  const files = req.files as CustomDiscordStorageFileResult[]
  const data: Prisma.NodeCreateManyInput[] = files.map((f) => ({
    name: f.originalname ?? '',
    parentId: node?.id,
    type: 'FILE',
  }))
  const nodes = await prisma.node.createManyAndReturn({
    data,
    skipDuplicates: true,
  })
  const fileDatas: Prisma.FileDataCreateManyInput[] = []

  nodes.forEach((n) => {
    const f = files.find((f) => f.originalname === n.name)

    if (!f) throw new Error('Something went wrong. Cannot find filedata of node!')

    f.discordResult.forEach((x) =>
      fileDatas.push({
        endRange: x.endRange,
        fieldId: n.id,
        size: x.size,
        startRange: x.startRange,
        url: x.url,
      }),
    )

    return
  })

  await prisma.fileData.createMany({ data: fileDatas })
  res.status(nodes.length ? 200 : 400).json({ files, nodes })
})

export const nodeCreateController = asyncWrapper(async (req, res) => {
  const parsedBody = await nodeCreateSchema.parseAsync(req.body)
  const node = await prisma.node.findFirst({ where: parsedBody })

  if (node?.id) {
    res.status(400).json({ message: DUPLICATE_ERROR_MESSAGE })
    return
  }

  const data = await prisma.node.create({ data: parsedBody })
  res.json(data)
})

export const nodeListController = asyncWrapper(async (req, res) => {
  const parsedParams = await nodeListQuerySchema.parseAsync(req.query)
  const nodes = await prisma.node.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    where: { parentId: parsedParams.parentId },
  })

  res.json(nodes)
})

export const nodeDownloadController = asyncWrapper(async (req, res) => {
  const parsedParams = nodeRetrieveParamsSchema.parse(req.params)
  const rangeString = req.headers.range

  const fileDatas = await prisma.fileData.findMany({
    orderBy: { startRange: 'asc' },
    where: { fieldId: parsedParams.id },
  })

  const endRange = fileDatas[fileDatas.length - 1].endRange
  const totalSize = endRange + 1
  const parsedRange = parseRange(rangeString ?? '', endRange)

  const stream = discordFile.fileStream(
    fileDatas.map((n) => ({
      endRange: n.endRange,
      filename: 'f',
      size: n.size,
      startRange: n.startRange,
      url: n.url,
    })),
    parsedRange[0],
    parsedRange[1],
  )

  res.writeHead(rangeString ? 206 : 200, {
    'Accept-Ranges': 'bytes',
    'content-disposition': 'attachment; filename=' + (req.node?.name ?? 'file'),
    'Content-Length': parsedRange[1] - parsedRange[0] + 1,
    'Content-Range': `bytes ${parsedRange[0].toString()}-${parsedRange[1].toString()}/${totalSize.toString()}`,
    'Content-Type': mime.getType(req.node?.name ?? '')?.toString() ?? mime.getType('txt')?.toString(),
  })

  const close = () => {
    if (!stream.destroyed) {
      stream.destroy()
    }
  }

  req.on('close', () => {
    console.log('Connection closed by client')
    close()
  })

  stream
    .pipe(res)
    .on('close', close)
    .on('error', (err) => {
      console.error('error:', err)
      close()
    })
})
