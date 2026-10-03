import postgres from 'postgres'
import { runMigrations } from '../../src/db/migrate.js'
import { TEST_DATABASE_URL } from './database.js'

/** Recria o banco de testes do zero e aplica as migrações. */
export default async function setup() {
  const sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} })
  try {
    await sql`drop schema if exists public cascade`
    await sql`drop schema if exists drizzle cascade`
    await sql`create schema public`
  } catch (err) {
    throw new Error(
      `Não foi possível preparar o banco de testes em ${TEST_DATABASE_URL}. ` +
        'Suba o Postgres com `npm run db:up`.',
      { cause: err },
    )
  } finally {
    await sql.end()
  }

  await runMigrations(TEST_DATABASE_URL)
}
