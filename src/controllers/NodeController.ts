import { cache } from '@/cache'
import { db } from '@/db'
import { filesTable, nodesTable } from '@/db/schema'
import { discordFile } from '@/discord/DiscordFile'
import { CustomDiscordStorageFileResult } from '@/discord/DiscordStorage'
import { logger } from '@/logger'
import { idSchema, nodeCreateFolderSchema, nodeCreateSchema, nodeParentSchema } from '@/schemas/NodeSchemas'
import { createNode, createNodes, deleteNode, getNode, getNodes } from '@/services/nodeService'
import { asyncWrapper, parseRange } from '@/utils'
import { asc, eq, inArray, sql, SQL } from 'drizzle-orm'
import mime from 'mime'
import { PassThrough } from 'stream'

export const NODE_NOT_FOUND_MESSAGE = 'Node not found!'
export const DUPLICATE_ERROR_MESSAGE = 'Duplicate record: unique constraint failed.'

export const nodeRetrieveController = asyncWrapper(async (req, res) => {
  const { id } = idSchema.parse(req.params)
  const node = await getNode({ id })

  if (!node) {
    res.status(404).json({ message: NODE_NOT_FOUND_MESSAGE })
    return
  }

  const prevNodes: (typeof nodesTable.$inferInsert)[] = []
  let parentNodeId: null | number = node.parent

  while (parentNodeId) {
    const parentNode = await getNode({ id: parentNodeId })
    if (!parentNode) break
    console.log(parentNode)
    prevNodes.push(parentNode)
    parentNodeId = parentNode.parent
  }

  res.json({
    ...node,
    nodeFiles: await db.select().from(filesTable).where(eq(filesTable.node, node.id)).orderBy(asc(filesTable.startRange)),
    prevNodes,
  })
})

export const nodeCreateFolderController = asyncWrapper(async (req, res) => {
  const { name, parent = null } = await nodeCreateFolderSchema.parseAsync(req.body)
  const node = await getNode({ name, parent, type: 'FOLDER' })

  if (node) {
    res.status(400).json({ message: DUPLICATE_ERROR_MESSAGE })
    return
  }

  const data = await createNode({ name, parent, type: 'FOLDER' })
  res.json(data)
})

export const nodeUploadFilesController = asyncWrapper(async (req, res) => {
  const { parent } = await nodeParentSchema.parseAsync(req.body)
  let parentNode: typeof nodesTable.$inferSelect | undefined = undefined
  const files = req.files as CustomDiscordStorageFileResult[]
  const nodeFiles: (typeof filesTable.$inferInsert)[] = []

  if (parent) {
    parentNode = await getNode({ id: parent, type: 'FOLDER' })

    if (!parentNode) {
      res.status(404).json({ message: NODE_NOT_FOUND_MESSAGE })
      // TODO: delete the file from storage if possible
      return
    }
  }

  if (!files[0]?.discordResult.length) {
    res.status(400).json({ message: 'Discord file upload result are empty!' })
    return
  }

  const data: (typeof nodesTable.$inferInsert)[] = files.map((f) => ({
    name: f.originalname ?? '',
    parent: parentNode?.id,
    type: 'FILE',
  }))

  const createdNodes = await createNodes(data)

  createdNodes.forEach((n) => {
    const f = files.find((f) => f.originalname === n.name)

    if (!f) throw new Error('Cannot find filedata of node!')

    f.discordResult.forEach((x) =>
      nodeFiles.push({
        endRange: x.endRange,
        node: n.id,
        size: x.size,
        startRange: x.startRange,
        url: x.url,
      }),
    )
  })

  await db.insert(filesTable).values(nodeFiles)
  res.json({ nodes: createdNodes }).status(createdNodes.length ? 200 : 400)
})

export const nodeCreateController = asyncWrapper(async (req, res) => {
  const { name, parent, type } = await nodeCreateSchema.parseAsync(req.body)
  const node = await getNode({ name, parent, type })

  if (node) {
    res.status(400).json({ message: DUPLICATE_ERROR_MESSAGE })
    return
  }

  const data = await createNode({ name, parent, type })
  res.json(data)
})

export const nodeListController = asyncWrapper(async (req, res) => {
  const { parent } = await nodeParentSchema.parseAsync(req.query)
  const nodes = await getNodes({
    orderBy: [
      ['asc', 'type'],
      ['asc', 'name'],
      ['asc', 'id'],
    ],
    parent,
  })

  console.log(nodes)
  res.json(nodes)
})

export const nodeDownloadController = asyncWrapper(async (req, res) => {
  const { id } = idSchema.parse(req.params)
  const rangeString = req.headers.range

  const cacheKey = `nodefiles-${id.toString()}`
  let nodeFiles: (typeof filesTable.$inferSelect)[] | undefined = cache.get(cacheKey)

  logger.debug(`nodedl ${id.toString()} via ${!nodeFiles ? 'db' : 'cache'}`)

  if (!nodeFiles) {
    nodeFiles = await db.select().from(filesTable).where(eq(filesTable.node, id)).orderBy(asc(filesTable.startRange))
    if (nodeFiles.length) cache.set(cacheKey, nodeFiles)
  }

  if (!nodeFiles.length) {
    res.status(204).send()
    return
  }

  const endRange = nodeFiles[nodeFiles.length - 1].endRange
  const totalSize = endRange + 1
  const parsedRange = parseRange(rangeString ?? '', endRange)
  const passthrough = new PassThrough()

  const node = await getNode({ id, type: 'FILE' })
  res.writeHead(rangeString ? 206 : 200, {
    'Accept-Ranges': 'bytes',
    'content-disposition': 'attachment; filename=' + (node?.name ?? 'file'),
    'Content-Length': parsedRange[1] - parsedRange[0] + 1,
    'Content-Range': `bytes ${parsedRange[0].toString()}-${parsedRange[1].toString()}/${totalSize.toString()}`,
    'Content-Type': mime.getType(node?.name ?? '')?.toString() ?? mime.getType('txt')?.toString(),
  })

  passthrough.pipe(res)

  await discordFile.fileStream(
    passthrough,
    nodeFiles.map((n) => ({
      endRange: n.endRange,
      filename: n.id.toString(),
      size: n.size,
      startRange: n.startRange,
      url: n.url,
    })),
    parsedRange[0],
    parsedRange[1],
    async (response) => {
      // https://orm.drizzle.team/docs/guides/update-many-with-different-value
      const sqlChunks: SQL[] = []
      const ids: number[] = []

      sqlChunks.push(sql`(case`)

      for (const newFile of response.refreshed_urls) {
        const oldFile = nodeFiles.find((file) => file.url === newFile.original)
        if (!oldFile) throw new Error('Cannot find original file!')
        sqlChunks.push(sql`when ${filesTable.id} = ${oldFile.id} then ${newFile.refreshed}`)
        ids.push(oldFile.id)
      }

      sqlChunks.push(sql`end)`)
      const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '))
      await db.update(filesTable).set({ url: finalSql }).where(inArray(filesTable.id, ids))

      const latestNodeFiles = await db.select().from(filesTable).where(eq(filesTable.node, id)).orderBy(asc(filesTable.startRange))
      if (latestNodeFiles.length) cache.set(cacheKey, latestNodeFiles)
      logger.debug(latestNodeFiles, 'url has been refreshed')
    },
  )
})

export const nodeDeleteController = asyncWrapper(async (req, res) => {
  const { id } = idSchema.parse(req.params)
  const node = await getNode({ id })

  if (!node) {
    res.status(404).json({ message: NODE_NOT_FOUND_MESSAGE })
    return
  }

  const deleted = await deleteNode(node.id)
  res.json({ deleted })
})
