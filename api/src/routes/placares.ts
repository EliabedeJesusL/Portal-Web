import type { App } from '../app.js'
import { exigirEstacao } from '../auth/guards.js'
import { errorBodySchema } from '../errors.js'
import { placarSchema, registrarPlacar, resultadoPlacarSchema } from '../placares/registrar.js'

export async function placaresRoutes(app: App) {
  // `/api/resultados` é um alias temporário para o G3, enquanto migra para `/api/placares`.
  for (const url of ['/api/placares', '/api/resultados']) {
    app.post(
      url,
      {
        onRequest: exigirEstacao,
        schema: {
          tags: ['Placares'],
          summary: 'Registra a partida e o voto enviados pelo fliperama (201 nova, 200 repetida)',
          security: [{ estacao: [] }],
          body: placarSchema,
          response: {
            200: resultadoPlacarSchema,
            201: resultadoPlacarSchema,
            400: errorBodySchema,
            401: errorBodySchema,
            404: errorBodySchema,
            409: errorBodySchema,
          },
        },
      },
      async (request, reply) => {
        const resultado = await registrarPlacar(app.db, request.estacao!.id, request.body)
        return reply.status(resultado.duplicada ? 200 : 201).send(resultado)
      },
    )
  }
}
