import { z } from 'zod'
import type { App } from '../app.js'
import { exigirCurador } from '../auth/guards.js'
import { APELIDO_ANONIMO } from '../db/schema/index.js'
import { errorBodySchema } from '../errors.js'
import { anonimizarJogador } from '../rankings/anonimizar.js'
import { rankingJogadores, rankingJogadorSchema } from '../rankings/jogadores.js'
import { rankingJogos, rankingJogoSchema } from '../rankings/jogos.js'

const apelidoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{1,9}$/, 'use só letras e números, até 9 caracteres')

export async function rankingRoutes(app: App) {
  app.get(
    '/api/ranking/jogadores',
    {
      schema: {
        tags: ['Rankings'],
        summary: 'Ranking de jogadores de um jogo (melhor partida de cada apelido)',
        // Decisão da turma: o ranking de jogadores é sempre de um jogo.
        querystring: z.object({
          jogo: z.string({ error: 'informe o jogo: /api/ranking/jogadores?jogo=<id>' }).min(1),
          limite: z.coerce.number().int().min(1).max(500).default(100),
        }),
        response: {
          200: z.array(rankingJogadorSchema),
          400: errorBodySchema,
          404: errorBodySchema,
        },
      },
    },
    async (request) => rankingJogadores(app.db, request.query.jogo, request.query.limite),
  )

  app.get(
    '/api/ranking/jogos',
    {
      schema: {
        tags: ['Rankings'],
        summary: 'Ranking de jogos pela nota ajustada',
        response: { 200: z.array(rankingJogoSchema) },
      },
    },
    async () => rankingJogos(app.db),
  )

  app.post(
    '/api/ranking/jogadores/anonimizar',
    {
      onRequest: exigirCurador,
      schema: {
        tags: ['Rankings'],
        summary: 'Troca um apelido por ANON nas partidas e votos',
        security: [{ curador: [] }],
        body: z.object({
          apelido: apelidoSchema.refine((a) => a !== APELIDO_ANONIMO, 'esse apelido já é anônimo'),
          jogo: z.string().min(1).optional(),
        }),
        response: {
          200: z.object({
            ok: z.literal(true),
            apelido_anterior: z.string(),
            apelido_novo: z.string(),
            partidas: z.number().int(),
            votos: z.number().int(),
          }),
          400: errorBodySchema,
          401: errorBodySchema,
          404: errorBodySchema,
        },
      },
    },
    async (request) => {
      const { apelido, jogo } = request.body
      const alterados = await anonimizarJogador(app.db, {
        apelido,
        jogoId: jogo,
        curadorId: request.curador!.id,
      })
      request.log.info(
        { jogo, ...alterados, curador: request.curador!.nome },
        'jogador anonimizado',
      )
      return {
        ok: true as const,
        apelido_anterior: apelido,
        apelido_novo: APELIDO_ANONIMO,
        ...alterados,
      }
    },
  )
}
