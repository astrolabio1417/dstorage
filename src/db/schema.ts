import { sql } from 'drizzle-orm'
import { foreignKey, integer, pgEnum, pgTable, timestamp, unique, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

export const typesEnum = pgEnum('types', ['FOLDER', 'FILE'])

export const nodesTable = pgTable(
  'nodes',
  {
    createdAt: timestamp().defaultNow().notNull(),
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    parent: integer('parent'),
    type: typesEnum().default('FOLDER'),
    updatedAt: timestamp(),
  },
  (table) => [
    foreignKey({
      columns: [table.parent],
      foreignColumns: [table.id],
      name: 'parent_fk',
    }).onDelete('cascade'),
    uniqueIndex('unique_name_parent_not_null')
      .on(table.name, table.parent)
      .where(sql`${table.parent} IS NOT NULL`),
    uniqueIndex('unique_name_parent_null')
      .on(table.name)
      .where(sql`${table.parent} IS NULL`),
  ],
)

export const filesTable = pgTable(
  'files',
  {
    createdAt: timestamp().defaultNow().notNull(),
    endRange: integer().notNull().default(0),
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    node: integer('node').references(() => nodesTable.id, { onDelete: 'cascade' }),
    size: integer().notNull().default(0),
    startRange: integer().notNull().default(0),
    url: varchar({ length: 255 }).notNull(),
  },
  (table) => [unique('field__start_range').on(table.node, table.startRange)],
)
