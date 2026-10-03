import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { createDb } from './client.js'

// Mesmo caminho relativo a partir de src/db e de dist/db.
const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url))

export async function runMigrations(url: string) {
  const { db, close } = createDb(url)
  try {
    await migrate(db, { migrationsFolder })
  } finally {
    await close()
  }
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('Defina DATABASE_URL para rodar as migrações.')
    process.exit(1)
  }
  await runMigrations(url)
  console.log('Migrações aplicadas.')
}
