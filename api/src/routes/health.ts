import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { App } from '../app.js'
import { errorBodySchema, type ErrorBody } from '../errors.js'

const SERVICE = 'plataforma-gestao-api' as const

export async function healthRoutes(app: App) {
  for (const url of ['/health', '/api/health']) {
    app.get(
      url,
      {
        schema: {
          tags: ['Sistema'],
          summary: 'Saúde da API e do banco',
          response: {
            // `ok` e `service` são os campos que o Portal (G2) lê.
            200: z.object({
              ok: z.literal(true),
              service: z.literal(SERVICE),
              status: z.literal('ok'),
              banco: z.literal('ok'),
            }),
            503: errorBodySchema,
          },
        },
      },
      async (request, reply) => {
        try {
          await app.db.execute(sql`select 1`)
        } catch (err) {
          request.log.error({ err }, 'banco indisponível')
          const body: ErrorBody = {
            codigo: 'BANCO_INDISPONIVEL',
            erro: 'Não foi possível conectar ao banco de dados.',
          }
          return reply.status(503).send(body)
        }
        return { ok: true as const, service: SERVICE, status: 'ok' as const, banco: 'ok' as const }
      },
    )
  }
}
