import { z } from 'zod'
import type { App } from '../app.js'
import { exigirCurador } from '../auth/guards.js'
import { errorBodySchema } from '../errors.js'

export async function curadoresRoutes(app: App) {
  // Permite ao Portal validar o token do curador no login.
  app.get(
    '/api/curadores/eu',
    {
      onRequest: exigirCurador,
      schema: {
        tags: ['Autenticação'],
        summary: 'Valida o token do curador e devolve quem é',
        security: [{ curador: [] }],
        response: {
          200: z.object({ id: z.uuid(), nome: z.string() }),
          401: errorBodySchema,
        },
      },
    },
    async (request) => request.curador!,
  )
}
