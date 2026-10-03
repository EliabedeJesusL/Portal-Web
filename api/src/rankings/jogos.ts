import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Db } from '../db/client.js'
import { APELIDO_ANONIMO } from '../db/schema/index.js'

/** Mínimo de votos para a nota do jogo pesar mais que a média geral. */
export const VOTOS_MINIMOS = 5
/** Média usada enquanto ainda não existe nenhum voto (meio da escala de 1 a 5). */
const MEDIA_SEM_VOTOS = 3

// Formato do GameRank do Portal (web/src/api.ts).
export const rankingJogoSchema = z.object({
  posicao: z.number().int(),
  jogo_id: z.string(),
  jogo: z.string(),
  nota: z.number(),
  votos: z.number().int(),
  partidas: z.number().int(),
  jogadores_distintos: z.number().int(),
  nota_ajustada: z.number(),
})

export type RankingJogo = z.infer<typeof rankingJogoSchema>

type Linha = {
  jogo_id: string
  jogo: string
  media: string | null
  votos: number
  partidas: number
  jogadores_distintos: number
}

const arredondar = (n: number) => Math.round(n * 100) / 100

/**
 * Ranking dos jogos aprovados pela média ponderada (bayesiana):
 *   nota_ajustada = v/(v+m)·R + m/(v+m)·C
 * v = votos do jogo, R = média do jogo, m = VOTOS_MINIMOS, C = média de todos os votos.
 * Assim um jogo com um único voto 5 não passa um jogo com muitos votos 4,8.
 * Desempate: jogadores distintos, depois partidas.
 */
export async function rankingJogos(db: Db) {
  const [linhas, [global]] = await Promise.all([
    db.execute<Linha>(sql`
      select
        j.id as jogo_id,
        j.nome as jogo,
        (select avg(nota) from votos where jogo_id = j.id) as media,
        (select count(*)::int from votos where jogo_id = j.id) as votos,
        (select count(*)::int from partidas where jogo_id = j.id) as partidas,
        (select count(distinct jogador)::int from partidas
          where jogo_id = j.id and jogador <> ${APELIDO_ANONIMO}) as jogadores_distintos
      from jogos j
      where exists (select 1 from versoes v where v.jogo_id = j.id and v.estado = 'aprovado')
    `),
    db.execute<{ media: string | null }>(sql`select avg(nota) as media from votos`),
  ])

  const C = global?.media ? Number(global.media) : MEDIA_SEM_VOTOS
  const m = VOTOS_MINIMOS

  return linhas
    .map((l) => {
      const v = l.votos
      const R = l.media ? Number(l.media) : 0
      return {
        jogo_id: l.jogo_id,
        jogo: l.jogo,
        nota: arredondar(R),
        votos: v,
        partidas: l.partidas,
        jogadores_distintos: l.jogadores_distintos,
        notaAjustada: (v / (v + m)) * R + (m / (v + m)) * C,
      }
    })
    .sort(
      (a, b) =>
        b.notaAjustada - a.notaAjustada ||
        b.jogadores_distintos - a.jogadores_distintos ||
        b.partidas - a.partidas ||
        a.jogo.localeCompare(b.jogo),
    )
    .map(
      ({ notaAjustada, ...resto }, i): RankingJogo => ({
        posicao: i + 1,
        ...resto,
        nota_ajustada: arredondar(notaAjustada),
      }),
    )
}
