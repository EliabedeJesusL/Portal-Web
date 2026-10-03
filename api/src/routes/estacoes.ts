import { asc } from 'drizzle-orm'
import { z } from 'zod'
import type { App } from '../app.js'
import { criarEstacao } from '../auth/credenciais.js'
import { exigirCurador } from '../auth/guards.js'
import { estacoes } from '../db/schema/index.js'
import { errorBodySchema } from '../errors.js'

const estacaoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  criado_em: z.iso.datetime(),
})

const erros = { 400: errorBodySchema, 401: errorBodySchema }

export async function estacoesRoutes(app: App) {
  app.post(
    '/api/estacoes',
    {
      onRequest: exigirCurador,
      schema: {
        tags: ['Autenticação'],
        summary: 'Cria uma estação (fliperama) e devolve o token uma única vez',
        security: [{ curador: [] }],
        body: z.object({ nome: z.string().trim().min(1).max(100) }),
        response: {
          201: estacaoSchema.extend({
            token: z.string().describe('Mostrado só nesta resposta; guarde no fliperama.'),
          }),
          ...erros,
        },
      },
    },
    async (request, reply) => {
      const estacao = await criarEstacao(app.db, request.body.nome)
      return reply.status(201).send({
        id: estacao.id,
        nome: estacao.nome,
        token: estacao.token,
        criado_em: estacao.criadoEm.toISOString(),
      })
    },
  )

  app.get(
    '/api/estacoes',
    {
      onRequest: exigirCurador,
      schema: {
        tags: ['Autenticação'],
        summary: 'Lista as estações (sem os tokens)',
        security: [{ curador: [] }],
        response: { 200: z.array(estacaoSchema), ...erros },
      },
    },
    async () => {
      const lista = await app.db
        .select({ id: estacoes.id, nome: estacoes.nome, criadoEm: estacoes.criadoEm })
        .from(estacoes)
        .orderBy(asc(estacoes.criadoEm))
      return lista.map((e) => ({ id: e.id, nome: e.nome, criado_em: e.criadoEm.toISOString() }))
    },
  )
}
