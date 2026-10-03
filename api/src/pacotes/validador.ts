import { createHash } from 'node:crypto'
import { unzipSync, zipSync, type Zippable } from 'fflate'
import { z } from 'zod'
import { AppError } from '../errors.js'

export const LIMITE_PACOTE_BYTES = 20 * 1024 * 1024
/** Proteção contra zip bomb: soma dos arquivos já extraídos. */
export const LIMITE_EXTRAIDO_BYTES = 100 * 1024 * 1024
export const MINIMO_QUESTOES = 20

export type Arquivos = Map<string, Uint8Array>

export const manifestoSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use só letras minúsculas, números e hífens (ex.: quiz-invaders)')
    .max(60),
  nome: z.string().trim().min(1),
  versao: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/, 'use semver (ex.: 1.0.0)'),
  autores: z.array(z.string().trim().min(1)).min(1),
  descricao: z.string().trim().min(1),
  controles: z.string().trim().min(1),
  entrada: z.string().trim().min(1),
  capa: z.string().trim().min(1),
  classico_referencia: z.string().trim().min(1),
  mecanica: z.enum(['plataforma', 'labirinto', 'tiro', 'encaixe', 'corrida']),
  tema: z.string().trim().min(1),
  nivel: z.string().trim().min(1),
  questoes: z.string().trim().min(1),
})

export type Manifesto = z.infer<typeof manifestoSchema>

const questaoSchema = z
  .object({
    id: z.string().min(1),
    enunciado: z.string().trim().min(1),
    alternativas: z.array(z.string()).min(2),
    correta: z.number().int().min(0),
    explicacao: z.string(),
    fonte: z.string().optional(),
  })
  .refine((q) => q.correta < q.alternativas.length, {
    message: 'correta aponta para uma alternativa que não existe',
    path: ['correta'],
  })

const bancoQuestoesSchema = z.object({
  tema: z.string(),
  nivel: z.string(),
  questoes: z.array(questaoSchema),
})

export type PacoteValidado = {
  manifesto: Manifesto
  totalQuestoes: number
  /** Zip normalizado, com o jogo na raiz; é o que o fliperama baixa. */
  zip: Buffer
  sha256: string
}

function invalido(codigo: string, mensagem: string): never {
  throw new AppError(422, codigo, mensagem)
}

function listarProblemas(error: z.ZodError) {
  return error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
    .join('; ')
}

/** Tira `./` do começo e normaliza separadores; caminhos do manifesto são relativos à raiz. */
function normalizarCaminho(caminho: string) {
  return caminho.replaceAll('\\', '/').replace(/^(\.\/)+/, '')
}

/**
 * Extrai o zip. O GitHub coloca tudo dentro de uma pasta `<repo>-<sha>/`;
 * se todos os arquivos estiverem numa única pasta, ela é removida.
 */
export function extrairZip(zip: Uint8Array): Arquivos {
  let extraido = 0
  let entradas: Record<string, Uint8Array>
  try {
    entradas = unzipSync(zip, {
      filter: (file) => {
        extraido += file.originalSize
        if (extraido > LIMITE_EXTRAIDO_BYTES) {
          invalido(
            'PACOTE_GRANDE',
            `O jogo passa de ${LIMITE_EXTRAIDO_BYTES / 1024 / 1024} MB descompactado.`,
          )
        }
        return !file.name.endsWith('/')
      },
    })
  } catch (err) {
    if (err instanceof AppError) throw err
    invalido('PACOTE_INVALIDO', 'Não foi possível abrir o zip do repositório.')
  }

  const nomes = Object.keys(entradas)
  const primeiros = new Set(nomes.map((nome) => nome.split('/')[0]))
  const [pasta] = primeiros
  const prefixo =
    primeiros.size === 1 && nomes.every((nome) => nome.includes('/')) ? `${pasta}/` : ''

  const arquivos: Arquivos = new Map()
  for (const nome of nomes) {
    arquivos.set(nome.slice(prefixo.length), entradas[nome]!)
  }
  return arquivos
}

function lerJson(arquivos: Arquivos, caminho: string, codigo: string) {
  const conteudo = arquivos.get(caminho)!
  try {
    return JSON.parse(Buffer.from(conteudo).toString('utf8').replace(/^﻿/, '')) as unknown
  } catch {
    invalido(codigo, `${caminho} não é um JSON válido.`)
  }
}

/** Aplica as regras do contrato e devolve o pacote pronto para guardar. */
export function validarPacote(arquivos: Arquivos): PacoteValidado {
  if (!arquivos.has('index.html')) {
    invalido(
      'SEM_INDEX',
      'Não há index.html na raiz do repositório. O jogo precisa abrir a partir de /index.html.',
    )
  }
  if (!arquivos.has('game.json')) {
    invalido(
      'SEM_MANIFESTO',
      'Não há game.json na raiz do repositório. Crie o manifesto seguindo o modelo da especificação.',
    )
  }

  const parsed = manifestoSchema.safeParse(lerJson(arquivos, 'game.json', 'MANIFESTO_INVALIDO'))
  if (!parsed.success) {
    invalido('MANIFESTO_INVALIDO', `game.json inválido: ${listarProblemas(parsed.error)}`)
  }
  const manifesto = parsed.data

  for (const campo of ['entrada', 'capa', 'questoes'] as const) {
    const caminho = normalizarCaminho(manifesto[campo])
    if (!arquivos.has(caminho)) {
      invalido(
        'MANIFESTO_INVALIDO',
        `game.json: ${campo} aponta para "${manifesto[campo]}", que não existe no repositório.`,
      )
    }
  }

  const caminhoQuestoes = normalizarCaminho(manifesto.questoes)
  const banco = bancoQuestoesSchema.safeParse(
    lerJson(arquivos, caminhoQuestoes, 'MANIFESTO_INVALIDO'),
  )
  if (!banco.success) {
    invalido('MANIFESTO_INVALIDO', `${caminhoQuestoes} inválido: ${listarProblemas(banco.error)}`)
  }
  const { questoes } = banco.data

  if (questoes.length < MINIMO_QUESTOES) {
    invalido(
      'POUCAS_QUESTOES',
      `${caminhoQuestoes} tem ${questoes.length} questões; o mínimo é ${MINIMO_QUESTOES}.`,
    )
  }

  const semFonte = questoes.filter((q) => !q.fonte?.trim()).map((q) => q.id)
  if (semFonte.length) {
    invalido(
      'QUESTAO_SEM_FONTE',
      `Toda questão precisa de uma fonte verificável. Sem fonte: ${semFonte.join(', ')}.`,
    )
  }

  const zip = empacotar(arquivos)
  if (zip.length > LIMITE_PACOTE_BYTES) {
    invalido('PACOTE_GRANDE', `O pacote passa de ${LIMITE_PACOTE_BYTES / 1024 / 1024} MB.`)
  }

  return {
    manifesto,
    totalQuestoes: questoes.length,
    zip,
    sha256: createHash('sha256').update(zip).digest('hex'),
  }
}

/** Reempacota com data fixa, para o mesmo conteúdo gerar o mesmo sha256. */
function empacotar(arquivos: Arquivos) {
  const entradas: Zippable = {}
  for (const [nome, conteudo] of arquivos) entradas[nome] = conteudo
  return Buffer.from(zipSync(entradas, { level: 6, mtime: new Date('2000-01-01T00:00:00Z') }))
}
