import { z } from 'zod'
import type { App } from '../app.js'
import { exigirCurador } from '../auth/guards.js'
import { errorBodySchema } from '../errors.js'
import { origem } from '../http/origem.js'
import { gameSchema, montarGame } from '../jogos/apresentacao.js'
import { decidirVersao } from '../jogos/curadoria.js'

const decisaoSchema = z.object({
  decisao: z.enum(['aprovado', 'reprovado']),
  justificativa: z.string().trim().max(2000).optional(),
  // O Portal manda o nome do curador; quem decide é o dono do token.
  curador: z.string().optional(),
})

export async function versoesRoutes(app: App) {
  app.post(
    '/api/versoes/:id/decisao',
    {
      onRequest: exigirCurador,
      schema: {
        tags: ['Curadoria'],
        summary: 'Aprova ou reprova uma versão submetida',
        security: [{ curador: [] }],
        params: z.object({ id: z.uuid() }),
        body: decisaoSchema,
        response: {
          200: gameSchema,
          400: errorBodySchema,
          401: errorBodySchema,
          404: errorBodySchema,
          409: errorBodySchema,
          422: errorBodySchema,
        },
      },
    },
    async (request) => {
      const { decisao, justificativa } = request.body
      const jogoId = await decidirVersao(app.db, {
        versaoId: request.params.id,
        curadorId: request.curador!.id,
        decisao,
        justificativa,
      })

      request.log.info(
        { versao: request.params.id, decisao, curador: request.curador!.nome },
        'versão decidida',
      )
      const game = await montarGame(app.db, jogoId, {
        origem: origem(request),
        versaoFocoId: request.params.id,
      })
      return game!
    },
  )
}
