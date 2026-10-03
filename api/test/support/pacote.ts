import { strToU8, zipSync, type Zippable } from 'fflate'

export function manifestoValido(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quiz-teste',
    nome: 'Quiz Teste',
    versao: '1.0.0',
    autores: ['Fulana', 'Beltrano'],
    descricao: 'Um jogo de teste.',
    controles: 'Setas e espaço.',
    entrada: 'index.html',
    capa: 'capa.png',
    classico_referencia: 'Space Invaders',
    mecanica: 'tiro',
    tema: 'Matemática',
    nivel: 'ensino médio',
    questoes: 'questoes.json',
    ...overrides,
  }
}

export function questoesValidas(total = 20, overrides: Record<string, unknown> = {}) {
  return {
    tema: 'Matemática',
    nivel: 'ensino médio',
    questoes: Array.from({ length: total }, (_, i) => ({
      id: `q${i + 1}`,
      enunciado: `Quanto é ${i} + 1?`,
      alternativas: [`${i + 1}`, `${i + 2}`],
      correta: 0,
      explicacao: `${i} + 1 = ${i + 1}.`,
      fonte: 'https://pt.wikipedia.org/wiki/Adição',
      ...overrides,
    })),
  }
}

/** Arquivos de um jogo válido; `null` numa chave remove o arquivo. */
export function arquivosJogo(alteracoes: Record<string, unknown | null> = {}) {
  const base: Record<string, unknown> = {
    'index.html': '<!doctype html><title>Quiz Teste</title>',
    'game.json': manifestoValido(),
    'questoes.json': questoesValidas(),
    'capa.png': new Uint8Array([137, 80, 78, 71]),
    'js/jogo.js': 'console.log("oi")',
  }
  const arquivos: Zippable = {}
  for (const [nome, conteudo] of Object.entries({ ...base, ...alteracoes })) {
    if (conteudo === null) continue
    arquivos[nome] =
      conteudo instanceof Uint8Array
        ? conteudo
        : strToU8(typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo))
  }
  return arquivos
}

/** Zip no formato do GitHub: tudo dentro de `<repo>-<sha>/`. */
export function zipDoGithub(
  alteracoes: Record<string, unknown | null> = {},
  pasta = 'quiz-teste-abc123',
) {
  const arquivos = arquivosJogo(alteracoes)
  const comPasta: Zippable = {}
  for (const [nome, conteudo] of Object.entries(arquivos)) comPasta[`${pasta}/${nome}`] = conteudo
  return Buffer.from(zipSync(comPasta))
}
