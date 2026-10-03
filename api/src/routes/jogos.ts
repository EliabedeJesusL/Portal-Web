import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { App } from '../app.js'
import { jogos, pacotes, versoes } from '../db/schema/index.js'
import { AppError, errorBodySchema } from '../errors.js'
import { parseRepositorioUrl, urlCanonica } from '../github/cliente.js'
import { origem } from '../http/origem.js'
import {
  detalheSchema,
  estadoSchema,
  gameSchema,
  montarDetalhe,
  montarGame,
  type Game,
} from '../jogos/apresentacao.js'
import { LIMITE_PACOTE_BYTES, extrairZip, validarPacote } from '../pacotes/validador.js'

const submissaoSchema = z.object({
  repositorio_url: z.string().trim().min(1),
  ref: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9._\-/]+$/, 'use o nome de uma tag, como v1.0.0'),
  resumo: z.string().trim().max(300).optional(),
})

/** Erro de unicidade do Postgres, que o Drizzle embrulha em `cause`. */
function violacaoUnica(err: unknown, constraint: string) {
  const cause = (err as { cause?: { code?: string; constraint_name?: string } }).cause
  return cause?.code === '23505' && cause.constraint_name === constraint
}

export async function jogosRoutes(app: App) {
  app.get(
    '/api/jogos',
    {
      schema: {
        tags: ['Catálogo'],
        summary: 'Catálogo de jogos por status (padrão: aprovado)',
        querystring: z.object({ status: estadoSchema.default('aprovado') }),
        response: { 200: z.array(gameSchema), 400: errorBodySchema },
      },
    },
    async (request) => {
      // Uma entrada por versão no estado pedido; em `aprovado` há no máximo uma por jogo.
      const lista = await app.db
        .select({ id: versoes.id, jogoId: versoes.jogoId })
        .from(versoes)
        .where(eq(versoes.estado, request.query.status))
        .orderBy(desc(versoes.submetidoEm))

      const games = await Promise.all(
        lista.map((v) =>
          montarGame(app.db, v.jogoId, { origem: origem(request), versaoFocoId: v.id }),
        ),
      )
      return games.filter((g): g is Game => g !== null)
    },
  )

  app.get(
    '/api/jogos/:id',
    {
      schema: {
        tags: ['Catálogo'],
        summary: 'Detalhe do jogo, com versões, feedbacks e taxa de acerto por tema',
        params: z.object({ id: z.string() }),
        response: { 200: detalheSchema, 404: errorBodySchema },
      },
    },
    async (request) => {
      const detalhe = await montarDetalhe(app.db, request.params.id, { origem: origem(request) })
      if (!detalhe) {
        throw new AppError(404, 'JOGO_NAO_ENCONTRADO', `O jogo "${request.params.id}" não existe.`)
      }
      return detalhe
    },
  )

  app.post(
    '/api/jogos',
    {
      // Rota pública que baixa do GitHub: limita por IP.
      config: { rateLimit: { max: app.env.LIMITE_SUBMISSOES, timeWindow: '10 minutes' } },
      schema: {
        tags: ['Submissão'],
        summary: 'Submete um jogo pelo link do repositório GitHub e uma tag',
        body: submissaoSchema,
        response: {
          201: gameSchema,
          400: errorBodySchema,
          409: errorBodySchema,
          422: errorBodySchema,
          429: errorBodySchema,
          503: errorBodySchema,
        },
      },
    },
    async (request, reply) => {
      const { ref, resumo } = request.body
      const repositorio = parseRepositorioUrl(request.body.repositorio_url)
      const repositorioUrl = `https://github.com/${repositorio.owner}/${repositorio.repo}`

      const commitSha = await app.github.resolverRef(repositorio, ref)
      const zipOriginal = await app.github.baixarZip(repositorio, commitSha, LIMITE_PACOTE_BYTES)
      const pacote = validarPacote(extrairZip(zipOriginal))
      const { manifesto } = pacote

      const versaoId = await app.db.transaction(async (tx) => {
        const [existente] = await tx
          .select({ repositorioUrl: jogos.repositorioUrl })
          .from(jogos)
          .where(eq(jogos.id, manifesto.id))
          .for('update')

        if (existente && existente.repositorioUrl.toLowerCase() !== urlCanonica(repositorio)) {
          throw new AppError(
            409,
            'ID_EM_USO',
            `O id "${manifesto.id}" já pertence ao repositório ${existente.repositorioUrl}. Escolha outro id no game.json.`,
          )
        }

        if (!existente) {
          // Os metadados do jogo passam a refletir versões novas quando elas forem aprovadas.
          await tx.insert(jogos).values({
            id: manifesto.id,
            nome: manifesto.nome,
            descricao: manifesto.descricao,
            resumo: resumo || null,
            autores: manifesto.autores,
            controles: manifesto.controles,
            classicoReferencia: manifesto.classico_referencia,
            mecanica: manifesto.mecanica,
            tema: manifesto.tema,
            nivel: manifesto.nivel,
            capa: manifesto.capa,
            repositorioUrl,
          })
        }

        try {
          const [versao] = await tx
            .insert(versoes)
            .values({
              jogoId: manifesto.id,
              versao: manifesto.versao,
              ref,
              commitSha,
              tamanhoBytes: pacote.zip.length,
              sha256: pacote.sha256,
              manifesto,
              totalQuestoes: pacote.totalQuestoes,
            })
            .returning({ id: versoes.id })
          await tx.insert(pacotes).values({ versaoId: versao!.id, conteudo: pacote.zip })
          return versao!.id
        } catch (err) {
          if (violacaoUnica(err, 'versoes_numero_unico_por_jogo')) {
            throw new AppError(
              409,
              'VERSAO_JA_SUBMETIDA',
              `A versão ${manifesto.versao} de "${manifesto.id}" já foi submetida. Aumente a versão no game.json e crie uma nova tag.`,
            )
          }
          throw err
        }
      })

      request.log.info(
        { jogo: manifesto.id, versao: manifesto.versao, commitSha },
        'jogo submetido',
      )
      const game = await montarGame(app.db, manifesto.id, {
        origem: origem(request),
        versaoFocoId: versaoId,
      })
      return reply.status(201).send(game!)
    },
  )
}
