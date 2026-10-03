import { sql } from 'drizzle-orm'
import type { Db } from '../../src/db/client.js'

/** Apaga todos os dados, mantendo o schema. */
export async function limparBanco(db: Db) {
  await db.execute(
    sql`truncate jogos, versoes, pacotes, partidas, votos, estacoes, curadores, anonimizacoes cascade`,
  )
}
