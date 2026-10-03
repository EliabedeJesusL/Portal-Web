import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { jogos, pacotes, versoes } from '../src/db/schema/index.js'
import { AppError } from '../src/errors.js'
import type { GithubClient } from '../src/github/cliente.js'
import { createTestApp } from './support/app.js'
import { limparBanco } from './support/db.js'
import { manifestoValido, zipDoGithub } from './support/pacote.js'

const REPO = 'https://github.com/Arcade-IFES/quiz-teste'
const SHA = 'c'.repeat(40)

describe('POST /api/jogos', () => {
  let app: App
  let zipAtual: Buffer
  let erroGithub: AppError | null

  const github: GithubClient = {
    resolverRef: async () => {
      if (erroGithub) throw erroGithub
      return SHA
    },
    baixarZip: async () => zipAtual,
  }

  beforeAll(async () => {
    app = await createTestApp({ github })
    await app.ready()
  })

  beforeEach(async () => {
    await limparBanco(app.db)
    zipAtual = zipDoGithub()
    erroGithub = null
  })

  afterAll(async () => {
    await app.close()
  })

  function submeter(payload: Record<string, unknown> = {}) {
    return app.inject({
      method: 'POST',
      url: '/api/jogos',
      payload: { repositorio_url: REPO, ref: 'v1.0.0', ...payload },
    })
  }

  it('cria o jogo e a versão submetida e devolve o Game do Portal', async () => {
    const response = await submeter({ resumo: 'Resumo curto.' })

    expect(response.statusCode).toBe(201)
    const game = response.json()
    expect(game).toMatchObject({
      id: 'quiz-teste',
      nome: 'Quiz Teste',
      resumo: 'Resumo curto.',
      autores: ['Fulana', 'Beltrano'],
      mecanica: 'tiro',
      versao: '1.0.0',
      status: 'submetido',
      repositorio_url: REPO,
      nota_media: 0,
      votos: 0,
      jogadores_distintos: 0,
      partidas_jogadas: 0,
    })
    expect(game.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(game.versoes).toHaveLength(1)
    expect(game.versoes[0]).toMatchObject({
      id: game.versao_id,
      estado: 'submetido',
      ref: 'v1.0.0',
      commit_sha: SHA,
      total_questoes: 20,
    })
  })

  it('guarda o pacote normalizado com o tamanho e o sha256 informados', async () => {
    const game = (await submeter()).json()

    const [pacote] = await app.db
      .select()
      .from(pacotes)
      .where(eq(pacotes.versaoId, game.versao_id))

    expect(pacote!.conteudo.length).toBe(game.tamanho_bytes)
  })

  it('aceita uma nova versão do mesmo repositório sem mudar os dados do jogo', async () => {
    await submeter()
    zipAtual = zipDoGithub({
      'game.json': manifestoValido({ versao: '1.1.0', nome: 'Nome Novo' }),
    })

    const response = await submeter({
      ref: 'v1.1.0',
      repositorio_url: 'https://github.com/arcade-ifes/QUIZ-TESTE.git',
    })

    expect(response.statusCode).toBe(201)
    const game = response.json()
    expect(game.versao).toBe('1.1.0')
    expect(game.nome).toBe('Quiz Teste')
    expect(game.versoes.map((v: { versao: string }) => v.versao)).toEqual(['1.0.0', '1.1.0'])
  })

  it('dá 409 VERSAO_JA_SUBMETIDA para o mesmo número de versão', async () => {
    await submeter()

    const response = await submeter()

    expect(response.statusCode).toBe(409)
    expect(response.json().codigo).toBe('VERSAO_JA_SUBMETIDA')
  })

  it('permite reenviar o número de uma versão reprovada', async () => {
    await submeter()
    await app.db.update(versoes).set({ estado: 'reprovado' })

    const response = await submeter()

    expect(response.statusCode).toBe(201)
  })

  it('dá 409 ID_EM_USO quando outro repositório usa o mesmo id', async () => {
    await submeter()

    const response = await submeter({ repositorio_url: 'https://github.com/outra-equipe/copia' })

    expect(response.statusCode).toBe(409)
    expect(response.json().codigo).toBe('ID_EM_USO')
  })

  it('não grava nada quando o pacote é inválido', async () => {
    zipAtual = zipDoGithub({ 'game.json': null })

    const response = await submeter()

    expect(response.statusCode).toBe(422)
    expect(response.json().codigo).toBe('SEM_MANIFESTO')
    expect(await app.db.select().from(jogos)).toHaveLength(0)
  })

  it('repassa os erros do GitHub', async () => {
    erroGithub = new AppError(422, 'REF_NAO_ENCONTRADA', 'A ref não existe.')

    const response = await submeter()

    expect(response.statusCode).toBe(422)
    expect(response.json()).toEqual({ codigo: 'REF_NAO_ENCONTRADA', erro: 'A ref não existe.' })
  })

  it('dá 422 REPOSITORIO_INVALIDO para URL que não é do GitHub', async () => {
    const response = await submeter({ repositorio_url: 'https://gitlab.com/a/b' })

    expect(response.statusCode).toBe(422)
    expect(response.json().codigo).toBe('REPOSITORIO_INVALIDO')
  })

  it('dá 400 sem ref', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/jogos',
      payload: { repositorio_url: REPO },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().codigo).toBe('REQUISICAO_INVALIDA')
  })
})
