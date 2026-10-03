import type { FastifyError, FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { z } from 'zod'

// Mensagens de validação do Zod em português.
z.config(z.locales.ptBR())

/** Corpo de todas as respostas de erro; use nos `response` dos schemas das rotas. */
export const errorBodySchema = z.object({
  codigo: z.string(),
  erro: z.string(),
})

export type ErrorBody = z.infer<typeof errorBodySchema>

/** Erro de negócio que vira uma resposta `{ codigo, erro }` com o status informado. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly codigo: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** Erros de requisição do próprio Fastify, que vêm em inglês. */
const MENSAGENS_FASTIFY: Record<string, string> = {
  FST_ERR_CTP_INVALID_JSON_BODY: 'O corpo da requisição não é um JSON válido.',
  FST_ERR_CTP_EMPTY_JSON_BODY: 'O corpo da requisição está vazio, mas o Content-Type é JSON.',
  FST_ERR_CTP_INVALID_CONTENT_LENGTH:
    'O corpo recebido não bate com o Content-Length. Envie o JSON codificado em UTF-8.',
  FST_ERR_CTP_BODY_TOO_LARGE: 'O corpo da requisição é grande demais.',
  FST_ERR_CTP_INVALID_MEDIA_TYPE: 'Content-Type não suportado. Envie application/json.',
}

export function registerErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    const body: ErrorBody = {
      codigo: 'NAO_ENCONTRADO',
      erro: `Rota ${request.method} ${request.url} não existe.`,
    }
    return reply.status(404).send(body)
  })

  app.setErrorHandler<FastifyError | AppError>((error, request, reply) => {
    if (error instanceof AppError) {
      const body: ErrorBody = { codigo: error.codigo, erro: error.message }
      return reply.status(error.statusCode).send(body)
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const local = error.validationContext ?? 'requisição'
      const problemas = error.validation
        .map((issue) => {
          const campo = issue.instancePath.replace(/^\//, '').replaceAll('/', '.')
          return campo ? `${campo}: ${issue.message}` : issue.message
        })
        .join('; ')
      const body: ErrorBody = {
        codigo: 'REQUISICAO_INVALIDA',
        erro: `Dados inválidos em ${local}: ${problemas}`,
      }
      return reply.status(400).send(body)
    }

    const statusCode = error.statusCode ?? 500

    if (statusCode < 500) {
      const body: ErrorBody = {
        codigo: 'REQUISICAO_INVALIDA',
        erro: MENSAGENS_FASTIFY[error.code] ?? error.message,
      }
      return reply.status(statusCode).send(body)
    }

    request.log.error({ err: error }, 'erro não tratado')
    const body: ErrorBody = {
      codigo: 'ERRO_INTERNO',
      erro: 'Erro interno no servidor. Tente novamente mais tarde.',
    }
    return reply.status(500).send(body)
  })
}
