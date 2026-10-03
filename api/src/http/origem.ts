import type { FastifyRequest } from 'fastify'

/**
 * Origem pública da API, para montar URLs absolutas (o Portal roda em outro domínio).
 * Atrás do proxy do Render, depende de `trustProxy` para vir como https.
 */
export function origem(request: FastifyRequest) {
  return `${request.protocol}://${request.host}`
}
