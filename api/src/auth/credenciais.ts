import type { Db } from '../db/client.js'
import { curadores, estacoes } from '../db/schema/index.js'
import { gerarToken, hashToken } from './tokens.js'

/** Cria um curador e devolve o token em texto puro, que não fica salvo em lugar nenhum. */
export async function criarCurador(db: Db, nome: string) {
  const token = gerarToken('curador')
  const [curador] = await db
    .insert(curadores)
    .values({ nome, tokenHash: hashToken(token) })
    .returning({ id: curadores.id, nome: curadores.nome, criadoEm: curadores.criadoEm })
  return { ...curador!, token }
}

/** Cria uma estação e devolve o token em texto puro, que não fica salvo em lugar nenhum. */
export async function criarEstacao(db: Db, nome: string) {
  const token = gerarToken('estacao')
  const [estacao] = await db
    .insert(estacoes)
    .values({ nome, tokenHash: hashToken(token) })
    .returning({ id: estacoes.id, nome: estacoes.nome, criadoEm: estacoes.criadoEm })
  return { ...estacao!, token }
}
