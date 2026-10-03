import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Db } from '../db/client.js'
import { APELIDO_ANONIMO, jogos } from '../db/schema/index.js'
import { AppError } from '../errors.js'

// Formato do PlayerRank do Portal (web/src/api.ts), com detalhes da melhor partida.
export const rankingJogadorSchema = z.object({
  posicao: z.number().int(),
  apelido: z.string(),
  pontos: z.number().int(),
  jogo_id: z.string(),
  jogo: z.string(),
  acertos: z.number().int(),
  erros: z.number().int(),
  duracao_s: z.number().int(),
  jogado_em: z.iso.datetime(),
  partidas: z.number().int(),
})

export type RankingJogador = z.infer<typeof rankingJogadorSchema>

type Linha = {
  jogador: string
  pontos: number
  acertos: number
  erros: number
  duracao_s: number
  jogado_em: Date
  partidas: number
}

/**
 * Ranking de um jogo (decisão da turma: não há ranking geral).
 * Vale a melhor partida de cada apelido; no empate, quem fez primeiro.
 * Partidas ANON (sem apelido ou anonimizadas) ficam de fora.
 */
export async function rankingJogadores(db: Db, jogoId: string, limite: number) {
  const [jogo] = await db.select({ nome: jogos.nome }).from(jogos).where(eq(jogos.id, jogoId))
  if (!jogo) throw new AppError(404, 'JOGO_NAO_ENCONTRADO', `O jogo "${jogoId}" não existe.`)

  const linhas = await db.execute<Linha>(sql`
    with melhores as (
      select distinct on (jogador)
        jogador, pontos, acertos, erros, duracao_s, jogado_em,
        count(*) over (partition by jogador)::int as partidas
      from partidas
      where jogo_id = ${jogoId} and jogador <> ${APELIDO_ANONIMO}
      order by jogador, pontos desc, jogado_em asc
    )
    select * from melhores
    order by pontos desc, jogado_em asc, jogador asc
    limit ${limite}
  `)

  return linhas.map(
    (l, i): RankingJogador => ({
      posicao: i + 1,
      apelido: l.jogador,
      pontos: l.pontos,
      jogo_id: jogoId,
      jogo: jogo.nome,
      acertos: l.acertos,
      erros: l.erros,
      duracao_s: l.duracao_s,
      jogado_em: new Date(l.jogado_em).toISOString(),
      partidas: l.partidas,
    }),
  )
}
