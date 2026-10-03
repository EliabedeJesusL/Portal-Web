import { buildApp } from './app.js'
import { loadEnv } from './config/env.js'
import { createDb } from './db/client.js'

const env = loadEnv()
const { db, close } = createDb(env.DATABASE_URL)
const app = await buildApp({ env, db })

app.addHook('onClose', close)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void app.close())
}

await app.listen({ port: env.PORT, host: '0.0.0.0' })
