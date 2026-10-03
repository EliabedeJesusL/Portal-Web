import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import type { App } from '../app.js'
import { pacotes, versoes } from '../db/schema/index.js'
import { AppError } from '../errors.js'

/** `If-None-Match` pode trazer uma lista, com ou sem o prefixo fraco `W/`. */
function etagConfere(ifNoneMatch: string | undefined, etag: string) {
  if (!ifNoneMatch) return false
  if (ifNoneMatch.trim() === '*') return true
  return ifNoneMatch.split(',').some((valor) => valor.trim().replace(/^W\//, '') === etag)
}

export async function pacotesRoutes(app: App) {
  app.get(
    '/api/jogos/:id/pacote',
    {
      schema: {
        tags: ['Catálogo'],
        summary: 'Baixa o zip da versão aprovada (ETag, X-Sha256, 304)',
        params: z.object({ id: z.string() }),
        querystring: z.object({ versao: z.string().optional() }),
        // Sem `response`: o corpo é o zip (Buffer), e os erros saem pelo handler global.
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { versao } = request.query

      // Sem `versao`, é a aprovada. Com `versao`, também vale uma substituída
      // (o fliperama pode continuar numa versão anterior). Submetidas e reprovadas
      // não são baixáveis; a curadoria usa o preview.
      const [alvo] = await app.db
        .select({ id: versoes.id, versao: versoes.versao, sha256: versoes.sha256 })
        .from(versoes)
        .where(
          and(
            eq(versoes.jogoId, id),
            versao
              ? and(
                  eq(versoes.versao, versao),
                  inArray(versoes.estado, ['aprovado', 'substituida']),
                )
              : eq(versoes.estado, 'aprovado'),
          ),
        )

      if (!alvo) {
        throw new AppError(
          404,
          'PACOTE_NAO_ENCONTRADO',
          versao
            ? `O jogo "${id}" não tem a versão ${versao} aprovada.`
            : `O jogo "${id}" não existe ou não tem versão aprovada.`,
        )
      }

      const etag = `"${alvo.sha256}"`
      reply
        .header('ETag', etag)
        .header('X-Sha256', alvo.sha256)
        .header('X-Versao', alvo.versao)
        // Com `versao` o conteúdo nunca muda; sem ela, a aprovada pode mudar.
        .header(
          'Cache-Control',
          versao ? 'public, max-age=31536000, immutable' : 'public, no-cache',
        )

      if (etagConfere(request.headers['if-none-match'], etag)) {
        return reply.status(304).send()
      }

      const [pacote] = await app.db
        .select({ conteudo: pacotes.conteudo })
        .from(pacotes)
        .where(eq(pacotes.versaoId, alvo.id))
      if (!pacote) throw new Error(`Versão ${alvo.id} sem pacote guardado.`)

      return reply
        .type('application/zip')
        .header('Content-Disposition', `attachment; filename="${id}-${alvo.versao}.zip"`)
        .send(pacote.conteudo)
    },
  )
}
