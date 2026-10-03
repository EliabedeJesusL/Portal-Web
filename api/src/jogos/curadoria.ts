import { and, eq } from 'drizzle-orm'
import type { Db } from '../db/client.js'
import { jogos, versoes } from '../db/schema/index.js'
import { AppError } from '../errors.js'
import type { Manifesto } from '../pacotes/validador.js'
import { compararVersoes } from './semver.js'

export type Decisao = 'aprovado' | 'reprovado'

type Entrada = {
  versaoId: string
  curadorId: string
  decisao: Decisao
  justificativa?: string
}

/**
 * Máquina de estados da curadoria:
 *   submetido → aprovado   (a aprovada anterior do jogo vira `substituida`)
 *   submetido → reprovado  (exige justificativa; o autor pode reenviar o mesmo número)
 * Devolve o id do jogo da versão decidida.
 */
export async function decidirVersao(db: Db, { versaoId, curadorId, decisao, justificativa }: Entrada) {
  if (decisao === 'reprovado' && !justificativa) {
    throw new AppError(
      422,
      'JUSTIFICATIVA_OBRIGATORIA',
      'A reprovação exige uma justificativa, para o autor saber o que corrigir.',
    )
  }

  return db.transaction(async (tx) => {
    // Trava a versão para duas decisões simultâneas não passarem juntas.
    const [versao] = await tx
      .select()
      .from(versoes)
      .where(eq(versoes.id, versaoId))
      .for('update')

    if (!versao) {
      throw new AppError(404, 'VERSAO_NAO_ENCONTRADA', `A versão ${versaoId} não existe.`)
    }
    if (versao.estado !== 'submetido') {
      throw new AppError(
        409,
        'VERSAO_JA_DECIDIDA',
        `Esta versão já foi decidida: está como "${versao.estado}".`,
      )
    }

    if (decisao === 'aprovado') {
      const [atual] = await tx
        .select({ id: versoes.id, versao: versoes.versao })
        .from(versoes)
        .where(and(eq(versoes.jogoId, versao.jogoId), eq(versoes.estado, 'aprovado')))
        .for('update')

      if (atual && compararVersoes(versao.versao, atual.versao) <= 0) {
        throw new AppError(
          409,
          'VERSAO_ANTIGA',
          `A versão ${versao.versao} não é mais nova que a aprovada (${atual.versao}). Reprove-a ou peça ao autor um número maior.`,
        )
      }
      if (atual) {
        await tx.update(versoes).set({ estado: 'substituida' }).where(eq(versoes.id, atual.id))
      }

      // O catálogo passa a mostrar os dados do game.json da versão aprovada.
      const manifesto = versao.manifesto as Manifesto
      await tx
        .update(jogos)
        .set({
          nome: manifesto.nome,
          descricao: manifesto.descricao,
          autores: manifesto.autores,
          controles: manifesto.controles,
          classicoReferencia: manifesto.classico_referencia,
          mecanica: manifesto.mecanica,
          tema: manifesto.tema,
          nivel: manifesto.nivel,
          capa: manifesto.capa,
          atualizadoEm: new Date(),
        })
        .where(eq(jogos.id, versao.jogoId))
    }

    await tx
      .update(versoes)
      .set({
        estado: decisao,
        decididoPor: curadorId,
        decididoEm: new Date(),
        justificativa: justificativa || null,
      })
      .where(eq(versoes.id, versaoId))

    return versao.jogoId
  })
}
