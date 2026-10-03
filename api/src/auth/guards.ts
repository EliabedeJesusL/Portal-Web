import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { curadores, estacoes } from '../db/schema/index.js'
import { AppError } from '../errors.js'
import { hashToken } from './tokens.js'

export type Autenticado = { id: string; nome: string }

declare module 'fastify' {
  interface FastifyRequest {
    curador?: Autenticado
    estacao?: Autenticado
  }
}

function lerBearer(request: FastifyRequest) {
  const header = request.headers.authorization
  const match = header?.match(/^Bearer\s+(\S+)\s*$/i)
  if (!match) {
    throw new AppError(
      401,
      'NAO_AUTENTICADO',
      'Envie o token no cabeçalho Authorization: Bearer <token>.',
    )
  }
  return match[1]!
}

function tokenInvalido(): never {
  throw new AppError(401, 'TOKEN_INVALIDO', 'Token inválido ou revogado.')
}

/** Hook (onRequest) que exige um token de curador e preenche `request.curador`. */
export async function exigirCurador(request: FastifyRequest, _reply: FastifyReply) {
  const tokenHash = hashToken(lerBearer(request))
  const [curador] = await request.server.db
    .select({ id: curadores.id, nome: curadores.nome })
    .from(curadores)
    .where(eq(curadores.tokenHash, tokenHash))
  if (!curador) tokenInvalido()
  request.curador = curador
}

/** Hook (onRequest) que exige um token de estação e preenche `request.estacao`. */
export async function exigirEstacao(request: FastifyRequest, _reply: FastifyReply) {
  const tokenHash = hashToken(lerBearer(request))
  const [estacao] = await request.server.db
    .select({ id: estacoes.id, nome: estacoes.nome })
    .from(estacoes)
    .where(eq(estacoes.tokenHash, tokenHash))
  if (!estacao) tokenInvalido()
  request.estacao = estacao
}
