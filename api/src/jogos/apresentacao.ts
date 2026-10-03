import { asc, avg, count, countDistinct, desc, eq, sql, sum } from 'drizzle-orm'
import { z } from 'zod'
import type { Db } from '../db/client.js'
import { curadores, jogos, partidas, versoes, votos } from '../db/schema/index.js'
import type { Manifesto } from '../pacotes/validador.js'

// Formatos de resposta alinhados ao que o Portal (G2) consome em web/src/api.ts.

export const estadoSchema = z.enum(['submetido', 'aprovado', 'reprovado', 'substituida'])

export const versaoSchema = z.object({
  id: z.uuid(),
  jogo_id: z.string(),
  versao: z.string(),
  estado: estadoSchema,
  ref: z.string(),
  commit_sha: z.string(),
  tamanho_bytes: z.number().int(),
  sha256: z.string(),
  total_questoes: z.number().int(),
  submetido_em: z.iso.datetime(),
  decidido_em: z.iso.datetime().optional(),
  decidido_por: z.string().optional(),
  justificativa: z.string().optional(),
  repositorio_url: z.string(),
  preview_url: z.string(),
})

export const gameSchema = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: z.string(),
  resumo: z.string(),
  classico_referencia: z.string(),
  mecanica: z.string(),
  tema: z.string(),
  nivel: z.string(),
  autores: z.array(z.string()),
  controles: z.string(),
  capa: z.string(),
  repositorio_url: z.string(),
  // Da versão em foco: a aprovada, ou a mais recente se nenhuma foi aprovada.
  versao: z.string(),
  status: estadoSchema,
  versao_id: z.uuid(),
  tamanho_bytes: z.number().int(),
  sha256: z.string(),
  capa_url: z.string(),
  preview_url: z.string(),
  // Só para versões que o fliperama pode baixar (aprovada ou substituída).
  pacote_url: z.string().optional(),
  nota_media: z.number(),
  votos: z.number().int(),
  jogadores_distintos: z.number().int(),
  partidas_jogadas: z.number().int(),
  versoes: z.array(versaoSchema),
})

export const detalheSchema = gameSchema.extend({
  feedbacks: z.array(
    z.object({
      partida_id: z.uuid(),
      apelido: z.string(),
      nota: z.number().int(),
      comentario: z.string().optional(),
      criado_em: z.iso.datetime(),
    }),
  ),
  taxa_acerto_tema: z.array(
    z.object({
      tema: z.string(),
      acertos: z.number().int(),
      erros: z.number().int(),
      taxa: z.number(),
    }),
  ),
})

export type Game = z.infer<typeof gameSchema>
export type Detalhe = z.infer<typeof detalheSchema>

type Opcoes = {
  /** Origem pública da API (ex.: https://api.exemplo.com), para montar URLs absolutas. */
  origem: string
  /** Versão mostrada em `versao`/`status`; sem ela, vale a aprovada ou a mais recente. */
  versaoFocoId?: string
}

export function urlPreview(origem: string, versaoId: string, caminho = '') {
  return `${origem}/api/versoes/${versaoId}/preview/${caminho}`
}

function normalizarCaminho(caminho: string) {
  return caminho.replaceAll('\\', '/').replace(/^(\.\/)+/, '')
}

export async function montarGame(db: Db, jogoId: string, { origem, versaoFocoId }: Opcoes) {
  const [jogo] = await db.select().from(jogos).where(eq(jogos.id, jogoId))
  if (!jogo) return null

  const [listaVersoes, [notas], [jogadas]] = await Promise.all([
    db
      .select({ versao: versoes, curador: curadores.nome })
      .from(versoes)
      .leftJoin(curadores, eq(curadores.id, versoes.decididoPor))
      .where(eq(versoes.jogoId, jogoId))
      .orderBy(asc(versoes.submetidoEm)),
    db
      .select({ media: avg(votos.nota), total: count() })
      .from(votos)
      .where(eq(votos.jogoId, jogoId)),
    db
      .select({ total: count(), jogadores: countDistinct(partidas.jogador) })
      .from(partidas)
      .where(eq(partidas.jogoId, jogoId)),
  ])

  const todas = listaVersoes.map(({ versao: v, curador }) => {
    const manifesto = v.manifesto as Manifesto
    return {
      manifesto,
      publica: {
        id: v.id,
        jogo_id: v.jogoId,
        versao: v.versao,
        estado: v.estado,
        ref: v.ref,
        commit_sha: v.commitSha,
        tamanho_bytes: v.tamanhoBytes,
        sha256: v.sha256,
        total_questoes: v.totalQuestoes,
        submetido_em: v.submetidoEm.toISOString(),
        decidido_em: v.decididoEm?.toISOString(),
        decidido_por: curador ?? undefined,
        justificativa: v.justificativa ?? undefined,
        repositorio_url: jogo.repositorioUrl,
        preview_url: urlPreview(origem, v.id, normalizarCaminho(manifesto.entrada)),
      },
    }
  })

  const foco =
    todas.find((v) => v.publica.id === versaoFocoId) ??
    todas.find((v) => v.publica.estado === 'aprovado') ??
    todas.at(-1)
  if (!foco) return null

  const baixavel = foco.publica.estado === 'aprovado' || foco.publica.estado === 'substituida'

  const game: Game = {
    id: jogo.id,
    nome: jogo.nome,
    descricao: jogo.descricao,
    resumo: jogo.resumo ?? '',
    classico_referencia: jogo.classicoReferencia,
    mecanica: jogo.mecanica,
    tema: jogo.tema,
    nivel: jogo.nivel,
    autores: jogo.autores,
    controles: jogo.controles,
    capa: jogo.capa,
    repositorio_url: jogo.repositorioUrl,
    versao: foco.publica.versao,
    status: foco.publica.estado,
    versao_id: foco.publica.id,
    tamanho_bytes: foco.publica.tamanho_bytes,
    sha256: foco.publica.sha256,
    capa_url: urlPreview(origem, foco.publica.id, normalizarCaminho(foco.manifesto.capa)),
    preview_url: foco.publica.preview_url,
    pacote_url: baixavel
      ? `${origem}/api/jogos/${encodeURIComponent(jogo.id)}/pacote?versao=${encodeURIComponent(foco.publica.versao)}`
      : undefined,
    nota_media: notas?.media ? Math.round(Number(notas.media) * 100) / 100 : 0,
    votos: notas?.total ?? 0,
    jogadores_distintos: jogadas?.jogadores ?? 0,
    partidas_jogadas: jogadas?.total ?? 0,
    versoes: todas.map((v) => v.publica),
  }
  return game
}

/** Jogo com feedbacks e taxa de acerto por tema, para a página de detalhe. */
export async function montarDetalhe(db: Db, jogoId: string, opcoes: Opcoes) {
  const game = await montarGame(db, jogoId, opcoes)
  if (!game) return null

  const [feedbacks, temas] = await Promise.all([
    db
      .select()
      .from(votos)
      .where(eq(votos.jogoId, jogoId))
      .orderBy(desc(votos.atualizadoEm)),
    db
      .select({
        tema: partidas.tema,
        acertos: sql<number>`${sum(partidas.acertos)}::int`,
        erros: sql<number>`${sum(partidas.erros)}::int`,
      })
      .from(partidas)
      .where(eq(partidas.jogoId, jogoId))
      .groupBy(partidas.tema)
      .orderBy(asc(partidas.tema)),
  ])

  const detalhe: Detalhe = {
    ...game,
    feedbacks: feedbacks.map((v) => ({
      partida_id: v.idPartida,
      apelido: v.jogador,
      nota: v.nota,
      comentario: v.comentario ?? undefined,
      criado_em: v.atualizadoEm.toISOString(),
    })),
    taxa_acerto_tema: temas.map(({ tema, acertos, erros }) => ({
      tema,
      acertos,
      erros,
      taxa: acertos + erros ? Math.round((acertos / (acertos + erros)) * 1000) / 10 : 0,
    })),
  }
  return detalhe
}
