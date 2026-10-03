import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { curadores, estacoes } from './acesso.js'
import { jogos } from './catalogo.js'

/** Apelido que substitui o do jogador na anonimização. */
export const APELIDO_ANONIMO = 'ANON'

/** Uma partida jogada no fliperama. O `id_partida` vem da estação e garante o dedup. */
export const partidas = pgTable(
  'partidas',
  {
    idPartida: uuid().primaryKey(),
    jogoId: text()
      .notNull()
      .references(() => jogos.id, { onDelete: 'cascade' }),
    jogador: text().notNull(),
    pontos: integer().notNull(),
    duracaoS: integer().notNull(),
    acertos: integer().notNull(),
    erros: integer().notNull(),
    tema: text().notNull(),
    jogadoEm: timestamp({ withTimezone: true }).notNull(),
    estacaoId: uuid()
      .notNull()
      .references(() => estacoes.id),
    recebidoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.jogoId, t.jogador),
    check('partidas_jogador_valido', sql`${t.jogador} ~ '^[A-Z0-9]{1,9}$'`),
    check(
      'partidas_valores_nao_negativos',
      sql`${t.pontos} >= 0 and ${t.duracaoS} >= 0 and ${t.acertos} >= 0 and ${t.erros} >= 0`,
    ),
  ],
)

/** Nota de um jogador para um jogo. Um voto por (jogo, jogador); o último vale. */
export const votos = pgTable(
  'votos',
  {
    id: uuid().primaryKey().defaultRandom(),
    jogoId: text()
      .notNull()
      .references(() => jogos.id, { onDelete: 'cascade' }),
    jogador: text().notNull(),
    idPartida: uuid()
      .notNull()
      .references(() => partidas.idPartida, { onDelete: 'cascade' }),
    nota: smallint().notNull(),
    comentario: text(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Votos anonimizados deixam de ser únicos por jogador.
    uniqueIndex('votos_um_por_jogador')
      .on(t.jogoId, t.jogador)
      .where(sql`${t.jogador} <> ${sql.raw(`'${APELIDO_ANONIMO}'`)}`),
    check('votos_nota_valida', sql`${t.nota} between 1 and 5`),
    check('votos_jogador_valido', sql`${t.jogador} ~ '^[A-Z0-9]{1,9}$'`),
  ],
)

/** Registro de cada anonimização. Não guarda o apelido original. */
export const anonimizacoes = pgTable('anonimizacoes', {
  id: uuid().primaryKey().defaultRandom(),
  curadorId: uuid()
    .notNull()
    .references(() => curadores.id),
  jogoId: text().references(() => jogos.id, { onDelete: 'set null' }),
  partidasAfetadas: integer().notNull(),
  votosAfetados: integer().notNull(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
