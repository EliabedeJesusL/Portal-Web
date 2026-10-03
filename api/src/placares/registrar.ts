import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Db } from '../db/client.js'
import { APELIDO_ANONIMO, jogos, partidas, votos } from '../db/schema/index.js'
import { AppError } from '../errors.js'

const inteiro = z.number().min(0).transform(Math.round)
const nota = z.number().int().min(1).max(5)

/**
 * Placar enviado pelo fliperama. Aceita o formato da especificação
 * (`jogo`, `feedback: {nota, comentario}`) e o do mock do G2 (`jogo_id`, `nota`).
 * O apelido vem do jogo, na mensagem PLACAR (decisão da turma).
 */
export const placarSchema = z
  .object({
    id_partida: z.uuid().optional(),
    jogo: z.string().trim().min(1).optional(),
    jogo_id: z.string().trim().min(1).optional(),
    versao: z.string().optional(),
    jogador: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{1,9}$/, 'use só letras e números, até 9 caracteres')
      .optional(),
    pontos: inteiro,
    duracao_s: inteiro.default(0),
    acertos: inteiro.default(0),
    erros: inteiro.default(0),
    tema: z.string().trim().min(1).optional(),
    jogado_em: z.iso.datetime({ offset: true }).optional(),
    feedback: z
      .object({ nota, comentario: z.string().trim().max(500).optional() })
      .optional(),
    nota: nota.optional(),
    comentario: z.string().trim().max(500).optional(),
  })
  .refine((p) => p.jogo || p.jogo_id, { message: 'informe o jogo', path: ['jogo'] })

export type Placar = z.infer<typeof placarSchema>

export const partidaSchema = z.object({
  id_partida: z.uuid(),
  jogo: z.string(),
  jogador: z.string(),
  pontos: z.number().int(),
  duracao_s: z.number().int(),
  acertos: z.number().int(),
  erros: z.number().int(),
  tema: z.string(),
  jogado_em: z.iso.datetime(),
})

export const resultadoPlacarSchema = z.object({
  ok: z.literal(true),
  // true quando o id_partida já tinha sido recebido: nada foi gravado de novo.
  duplicada: z.boolean(),
  partida: partidaSchema,
  voto: z.object({ nota: z.number().int(), comentario: z.string().optional() }).nullable(),
})

export type ResultadoPlacar = z.infer<typeof resultadoPlacarSchema>

type LinhaPartida = typeof partidas.$inferSelect

function apresentar(partida: LinhaPartida, voto: { nota: number; comentario: string | null } | undefined, duplicada: boolean): ResultadoPlacar {
  return {
    ok: true,
    duplicada,
    partida: {
      id_partida: partida.idPartida,
      jogo: partida.jogoId,
      jogador: partida.jogador,
      pontos: partida.pontos,
      duracao_s: partida.duracaoS,
      acertos: partida.acertos,
      erros: partida.erros,
      tema: partida.tema,
      jogado_em: partida.jogadoEm.toISOString(),
    },
    voto: voto ? { nota: voto.nota, comentario: voto.comentario ?? undefined } : null,
  }
}

/**
 * Grava a partida e o voto. Reenviar o mesmo `id_partida` não duplica nada
 * (o fliperama pode repetir envios que ficaram sem resposta).
 */
export async function registrarPlacar(db: Db, estacaoId: string, placar: Placar) {
  const jogoId = (placar.jogo ?? placar.jogo_id)!
  const idPartida = placar.id_partida ?? randomUUID()
  const jogador = placar.jogador ?? APELIDO_ANONIMO
  const feedback =
    placar.feedback ?? (placar.nota ? { nota: placar.nota, comentario: placar.comentario } : undefined)

  return db.transaction(async (tx) => {
    const [jogo] = await tx.select({ tema: jogos.tema }).from(jogos).where(eq(jogos.id, jogoId))
    if (!jogo) {
      throw new AppError(404, 'JOGO_NAO_ENCONTRADO', `O jogo "${jogoId}" não existe.`)
    }

    const [nova] = await tx
      .insert(partidas)
      .values({
        idPartida,
        jogoId,
        jogador,
        pontos: placar.pontos,
        duracaoS: placar.duracao_s,
        acertos: placar.acertos,
        erros: placar.erros,
        tema: placar.tema ?? jogo.tema,
        jogadoEm: placar.jogado_em ? new Date(placar.jogado_em) : new Date(),
        estacaoId,
      })
      .onConflictDoNothing({ target: partidas.idPartida })
      .returning()

    if (!nova) {
      const [existente] = await tx.select().from(partidas).where(eq(partidas.idPartida, idPartida))
      if (existente!.jogoId !== jogoId) {
        throw new AppError(
          409,
          'PARTIDA_CONFLITANTE',
          `O id_partida ${idPartida} já foi usado numa partida de outro jogo.`,
        )
      }
      const [voto] = await tx
        .select({ nota: votos.nota, comentario: votos.comentario })
        .from(votos)
        .where(eq(votos.idPartida, idPartida))
      return apresentar(existente!, voto, true)
    }

    if (!feedback) return apresentar(nova, undefined, false)

    const valores = {
      jogoId,
      jogador,
      idPartida,
      nota: feedback.nota,
      comentario: feedback.comentario || null,
      atualizadoEm: new Date(),
    }
    const [voto] =
      jogador === APELIDO_ANONIMO
        ? // Votos sem apelido não se substituem entre si.
          await tx.insert(votos).values(valores).returning()
        : // Um voto por (jogo, jogador): o mais recente substitui o anterior.
          await tx
            .insert(votos)
            .values(valores)
            .onConflictDoUpdate({
              target: [votos.jogoId, votos.jogador],
              // Literal, não parâmetro: o Postgres precisa casar com o predicado do índice parcial.
              targetWhere: sql`${votos.jogador} <> ${sql.raw(`'${APELIDO_ANONIMO}'`)}`,
              set: {
                idPartida,
                nota: valores.nota,
                comentario: valores.comentario,
                atualizadoEm: valores.atualizadoEm,
              },
            })
            .returning()

    return apresentar(nova, voto, false)
  })
}

