import { and, eq } from 'drizzle-orm'
import type { Db } from '../db/client.js'
import { APELIDO_ANONIMO, anonimizacoes, jogos, partidas, votos } from '../db/schema/index.js'
import { AppError } from '../errors.js'

type Entrada = { apelido: string; jogoId?: string; curadorId: string }

/**
 * Troca o apelido por ANON nas partidas e nos votos (a pedido do jogador).
 * Sem `jogoId`, vale para todos os jogos. O registro em `anonimizacoes`
 * guarda quem fez e quanto mudou, mas não o apelido original.
 */
export async function anonimizarJogador(db: Db, { apelido, jogoId, curadorId }: Entrada) {
  return db.transaction(async (tx) => {
    if (jogoId) {
      const [jogo] = await tx.select({ id: jogos.id }).from(jogos).where(eq(jogos.id, jogoId))
      if (!jogo) throw new AppError(404, 'JOGO_NAO_ENCONTRADO', `O jogo "${jogoId}" não existe.`)
    }

    const doJogador = (tabela: typeof partidas | typeof votos) =>
      jogoId
        ? and(eq(tabela.jogador, apelido), eq(tabela.jogoId, jogoId))
        : eq(tabela.jogador, apelido)

    const partidasAlteradas = await tx
      .update(partidas)
      .set({ jogador: APELIDO_ANONIMO })
      .where(doJogador(partidas))
      .returning({ id: partidas.idPartida })
    const votosAlterados = await tx
      .update(votos)
      .set({ jogador: APELIDO_ANONIMO })
      .where(doJogador(votos))
      .returning({ id: votos.id })

    if (!partidasAlteradas.length && !votosAlterados.length) {
      throw new AppError(
        404,
        'APELIDO_NAO_ENCONTRADO',
        `Nenhuma partida ou voto com o apelido "${apelido}"${jogoId ? ` em "${jogoId}"` : ''}.`,
      )
    }

    await tx.insert(anonimizacoes).values({
      curadorId,
      jogoId: jogoId ?? null,
      partidasAfetadas: partidasAlteradas.length,
      votosAfetados: votosAlterados.length,
    })

    return { partidas: partidasAlteradas.length, votos: votosAlterados.length }
  })
}
