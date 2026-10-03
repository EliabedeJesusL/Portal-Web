import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { Env } from './config/env.js'
import type { Db } from './db/client.js'
import { AppError, registerErrorHandlers } from './errors.js'
import { createGithubClient, type GithubClient } from './github/cliente.js'
import { curadoresRoutes } from './routes/curadores.js'
import { estacoesRoutes } from './routes/estacoes.js'
import { healthRoutes } from './routes/health.js'
import { jogosRoutes } from './routes/jogos.js'
import { pacotesRoutes } from './routes/pacotes.js'
import { placaresRoutes } from './routes/placares.js'
import { previewRoutes } from './routes/preview.js'
import { rankingRoutes } from './routes/ranking.js'
import { versoesRoutes } from './routes/versoes.js'

export type AppOptions = {
  env: Env
  db: Db
  /** Nos testes, substitui o acesso real ao GitHub. */
  github?: GithubClient
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db
    github: GithubClient
    env: Env
  }
}

export async function buildApp({ env, db, github }: AppOptions) {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: env.LOG_LEVEL },
    // O Render fica na frente como proxy; assim protocolo, host e IP vêm dos X-Forwarded-*.
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.decorate('db', db)
  app.decorate('github', github ?? createGithubClient({ token: env.GITHUB_TOKEN }))
  app.decorate('env', env)

  registerErrorHandlers(app)

  // O Portal (G2) chama a API de outro domínio pelo navegador.
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'If-None-Match'],
    exposedHeaders: ['ETag', 'X-Sha256', 'X-Versao', 'Content-Disposition', 'Retry-After'],
    maxAge: 86400,
  })

  // Só as rotas que pedem (`config.rateLimit`) são limitadas; hoje, a submissão.
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, contexto) =>
      new AppError(
        429,
        'MUITAS_REQUISICOES',
        `Muitas requisições seguidas. Tente de novo em ${Math.ceil(contexto.ttl / 1000)} s.`,
      ),
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Recreio Arcade — Plataforma de Gestão (G1)',
        description:
          'API oficial do Recreio Arcade: submissão de jogos por link do GitHub, curadoria, catálogo e download para o fliperama, placares e rankings. Erros sempre no formato `{ "codigo": "...", "erro": "..." }`.',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          curador: { type: 'http', scheme: 'bearer', description: 'Token de curador (cur_...)' },
          estacao: { type: 'http', scheme: 'bearer', description: 'Token de estação (est_...)' },
        },
      },
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  await app.register(healthRoutes)
  await app.register(curadoresRoutes)
  await app.register(estacoesRoutes)
  await app.register(jogosRoutes)
  await app.register(pacotesRoutes)
  await app.register(previewRoutes)
  await app.register(versoesRoutes)
  await app.register(placaresRoutes)
  await app.register(rankingRoutes)

  return app
}

export type App = Awaited<ReturnType<typeof buildApp>>
