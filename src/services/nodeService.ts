import { db } from '@/db'
import { nodesTable } from '@/db/schema'
import { and, asc, desc, eq, isNull, SQL } from 'drizzle-orm'

type INode = typeof nodesTable.$inferSelect
type INodeOrderBy = ['asc' | 'desc', keyof INode][]

interface INodeRetrieveParams extends INode {
  orderBy: INodeOrderBy
  limit?: number
}

export async function createNode(data: typeof nodesTable.$inferInsert) {
  const nodes = await createNodes([data])
  if (nodes.length) return nodes[0]
  return nodes
}

export async function createNodes(data: (typeof nodesTable.$inferInsert)[]) {
  return await db.insert(nodesTable).values(data).returning()
}

export async function deleteNode(id: number) {
  const deleted = await db.delete(nodesTable).where(eq(nodesTable.id, id)).returning({
    deletedId: nodesTable.id,
  })

  return deleted
}

export async function getNode(data: Partial<INodeRetrieveParams>) {
  const nodes = await getNodes(data)

  if (!nodes.length) return

  return nodes[0]
}

export async function getNodes({ id, limit = -1, name, orderBy, parent, type }: Partial<INodeRetrieveParams>) {
  const conditions: SQL[] = []

  if (id) conditions.push(eq(nodesTable.id, id))
  if (name) conditions.push(eq(nodesTable.name, name))
  if (type) conditions.push(eq(nodesTable.type, type))
  if (parent === null) {
    conditions.push(isNull(nodesTable.parent))
  } else if (parent) {
    conditions.push(eq(nodesTable.parent, parent))
  }

  const nodes = await db
    .select()
    .from(nodesTable)
    .where(and(...conditions))
    .orderBy(...(orderBy?.map((i) => (i[0] === 'asc' ? asc(nodesTable[i[1]]) : desc(nodesTable[i[1]]))) ?? []))
    .limit(limit)

  if (!nodes.length) return []

  return nodes
}
