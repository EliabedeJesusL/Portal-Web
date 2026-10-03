import { sql } from 'drizzle-orm'
import {
  check,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { curadores } from './acesso.js'

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
})

export const estadoVersao = pgEnum('estado_versao', [
  'submetido',
  'aprovado',
  'reprovado',
  'substituida',
])

export type EstadoVersao = (typeof estadoVersao.enumValues)[number]

/** Um jogo do catálogo. O `id` é o slug do `game.json`. */
export const jogos = pgTable('jogos', {
  id: text().primaryKey(),
  nome: text().notNull(),
  descricao: text().notNull(),
  resumo: text(),
  autores: text().array().notNull(),
  controles: text().notNull(),
  classicoReferencia: text().notNull(),
  mecanica: text().notNull(),
  tema: text().notNull(),
  nivel: text().notNull(),
  capa: text().notNull(),
  repositorioUrl: text().notNull(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

/** Cada submissão de um jogo. Só uma versão por jogo pode estar `aprovado`. */
export const versoes = pgTable(
  'versoes',
  {
    id: uuid().primaryKey().defaultRandom(),
    jogoId: text()
      .notNull()
      .references(() => jogos.id, { onDelete: 'cascade' }),
    versao: text().notNull(),
    estado: estadoVersao().notNull().default('submetido'),
    ref: text().notNull(),
    commitSha: text().notNull(),
    tamanhoBytes: integer().notNull(),
    sha256: text().notNull(),
    manifesto: jsonb().notNull(),
    totalQuestoes: integer().notNull(),
    decididoPor: uuid().references(() => curadores.id),
    justificativa: text(),
    submetidoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    decididoEm: timestamp({ withTimezone: true }),
  },
  (t) => [
    index().on(t.jogoId),
    uniqueIndex('versoes_uma_aprovada_por_jogo')
      .on(t.jogoId)
      .where(sql`${t.estado} = 'aprovado'`),
    // Uma versão reprovada pode ser submetida de novo com o mesmo número.
    uniqueIndex('versoes_numero_unico_por_jogo')
      .on(t.jogoId, t.versao)
      .where(sql`${t.estado} <> 'reprovado'`),
    check('versoes_tamanho_positivo', sql`${t.tamanhoBytes} > 0`),
  ],
)

/** O zip de cada versão, separado para não pesar nas consultas de `versoes`. */
export const pacotes = pgTable('pacotes', {
  versaoId: uuid()
    .primaryKey()
    .references(() => versoes.id, { onDelete: 'cascade' }),
  conteudo: bytea().notNull(),
})
