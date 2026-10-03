import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

export function createDb(url: string) {
  const client = postgres(url, {
    max: 10,
    connect_timeout: 10,
    onnotice: () => {},
  })
  const db = drizzle({ client, schema, casing: 'snake_case' })

  return { db, close: () => client.end() }
}

export type Db = ReturnType<typeof createDb>['db']
