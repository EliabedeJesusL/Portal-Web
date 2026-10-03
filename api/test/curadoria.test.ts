import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { criarCurador, criarEstacao } from '../src/auth/credenciais.js'
import type { GithubClient } from '../src/github/cliente.js'
import { compararVersoes } from '../src/jogos/semver.js'
import { createTestApp } from './support/app.js'
import { limparBanco } from './support/db.js'
import { manifestoValido, zipDoGithub } from './support/pacote.js'

describe('compararVersoes', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.0.1', '1.0.0', 1],
    ['1.10.0', '1.9.0', 1],
    ['2.0.0', '10.0.0', -1],
    ['1.0.0-beta', '1.0.0', -1],
    ['1.0.0-beta.2', '1.0.0-beta.10', -1],
  ])('%s comparado a %s', (a, b, sinal) => {
    expect(Math.sign(compararVersoes(a, b))).toBe(sinal)
  })
})

describe('POST /api/versoes/:id/decisao', () => {
  let app: App
  let zipAtual: Buffer
  let token: string

  const github: GithubClient = {
    resolverRef: async () => 'e'.repeat(40),
    baixarZip: async () => zipAtual,
  }

  beforeAll(async () => {
    app = await createTestApp({ github })
    await app.ready()
  })

  beforeEach(async () => {
    await limparBanco(app.db)
    token = (await criarCurador(app.db, 'Curadora Ana')).token
  })

  afterAll(async () => {
    await app.close()
  })

  async function submeter(versao: string, manifesto: Record<string, unknown> = {}) {
    zipAtual = zipDoGithub({ 'game.json': manifestoValido({ versao, ...manifesto }) })
    const response = await app.inject({
      method: 'POST',
      url: '/api/jogos',
      payload: { repositorio_url: 'https://github.com/equipe/quiz-teste', ref: `v${versao}` },
    })
    expect(response.statusCode).toBe(201)
    return response.json().versao_id as string
  }

  function decidir(
    versaoId: string,
    payload: Record<string, unknown>,
    autorizacao: string | null = `Bearer ${token}`,
  ) {
    return app.inject({
      method: 'POST',
      url: `/api/versoes/${versaoId}/decisao`,
      headers: autorizacao ? { authorization: autorizacao } : {},
      payload,
    })
  }

  async function estados() {
    const response = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste' })
    return Object.fromEntries(
      response.json().versoes.map((v: { versao: string; estado: string }) => [v.versao, v.estado]),
    )
  }

  it('aprova, registra quem decidiu e libera o download', async () => {
    const versaoId = await submeter('1.0.0')

    const response = await decidir(versaoId, {
      decisao: 'aprovado',
      justificativa: 'Tudo certo.',
      curador: 'nome enviado pelo portal é ignorado',
    })

    expect(response.statusCode).toBe(200)
    const game = response.json()
    expect(game).toMatchObject({ status: 'aprovado', versao: '1.0.0', versao_id: versaoId })
    expect(game.pacote_url).toContain('/api/jogos/quiz-teste/pacote?versao=1.0.0')
    expect(game.versoes[0]).toMatchObject({
      estado: 'aprovado',
      decidido_por: 'Curadora Ana',
      justificativa: 'Tudo certo.',
    })
    expect(game.versoes[0].decidido_em).toBeTypeOf('string')

    const catalogo = await app.inject({ method: 'GET', url: '/api/jogos' })
    expect(catalogo.json().map((g: { id: string }) => g.id)).toEqual(['quiz-teste'])
    const pacote = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste/pacote' })
    expect(pacote.statusCode).toBe(200)
  })

  it('ao aprovar uma versão nova, substitui a anterior e atualiza os dados do jogo', async () => {
    await decidir(await submeter('1.0.0'), { decisao: 'aprovado' })
    const nova = await submeter('1.1.0', { nome: 'Quiz Teste Turbo', tema: 'Física' })

    const pendente = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste' })
    expect(pendente.json().nome).toBe('Quiz Teste')

    const response = await decidir(nova, { decisao: 'aprovado' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ nome: 'Quiz Teste Turbo', tema: 'Física', versao: '1.1.0' })
    expect(await estados()).toEqual({ '1.0.0': 'substituida', '1.1.0': 'aprovado' })
  })

  it('reprova com justificativa sem mexer na versão aprovada', async () => {
    await decidir(await submeter('1.0.0'), { decisao: 'aprovado' })
    const nova = await submeter('1.1.0')

    const response = await decidir(nova, {
      decisao: 'reprovado',
      justificativa: 'A questão q3 está com a fonte quebrada.',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ status: 'reprovado', versao: '1.1.0' })
    expect(await estados()).toEqual({ '1.0.0': 'aprovado', '1.1.0': 'reprovado' })
  })

  it('exige justificativa para reprovar', async () => {
    const versaoId = await submeter('1.0.0')

    const response = await decidir(versaoId, { decisao: 'reprovado', justificativa: '   ' })

    expect(response.statusCode).toBe(422)
    expect(response.json().codigo).toBe('JUSTIFICATIVA_OBRIGATORIA')
    expect(await estados()).toEqual({ '1.0.0': 'submetido' })
  })

  it('dá 409 VERSAO_JA_DECIDIDA para decidir de novo', async () => {
    const versaoId = await submeter('1.0.0')
    await decidir(versaoId, { decisao: 'aprovado' })

    const response = await decidir(versaoId, { decisao: 'reprovado', justificativa: 'Mudei de ideia.' })

    expect(response.statusCode).toBe(409)
    expect(response.json().codigo).toBe('VERSAO_JA_DECIDIDA')
  })

  it('não aprova uma versão mais antiga que a aprovada', async () => {
    const antiga = await submeter('1.1.0')
    const nova = await submeter('1.2.0')
    await decidir(nova, { decisao: 'aprovado' })

    const response = await decidir(antiga, { decisao: 'aprovado' })

    expect(response.statusCode).toBe(409)
    expect(response.json().codigo).toBe('VERSAO_ANTIGA')
    expect(await estados()).toEqual({ '1.1.0': 'submetido', '1.2.0': 'aprovado' })
  })

  it('permite reenviar e aprovar o número de uma versão reprovada', async () => {
    await decidir(await submeter('1.0.0'), { decisao: 'reprovado', justificativa: 'Faltou a capa.' })

    const reenvio = await submeter('1.0.0')
    const response = await decidir(reenvio, { decisao: 'aprovado' })

    expect(response.statusCode).toBe(200)
    expect(response.json().versoes.map((v: { estado: string }) => v.estado)).toEqual([
      'reprovado',
      'aprovado',
    ])
  })

  it('só aceita decisões de curador', async () => {
    const versaoId = await submeter('1.0.0')
    const estacao = await criarEstacao(app.db, 'Fliperama')

    const semToken = await decidir(versaoId, { decisao: 'aprovado' }, null)
    const comEstacao = await decidir(versaoId, { decisao: 'aprovado' }, `Bearer ${estacao.token}`)

    expect(semToken.statusCode).toBe(401)
    expect(comEstacao.statusCode).toBe(401)
    expect(await estados()).toEqual({ '1.0.0': 'submetido' })
  })

  it('dá 404 VERSAO_NAO_ENCONTRADA e 400 para decisão inválida', async () => {
    const versaoId = await submeter('1.0.0')

    const inexistente = await decidir('00000000-0000-4000-8000-000000000000', { decisao: 'aprovado' })
    const invalida = await decidir(versaoId, { decisao: 'talvez' })

    expect(inexistente.statusCode).toBe(404)
    expect(inexistente.json().codigo).toBe('VERSAO_NAO_ENCONTRADA')
    expect(invalida.statusCode).toBe(400)
  })

  it('não deixa duas decisões simultâneas passarem', async () => {
    const versaoId = await submeter('1.0.0')

    const respostas = await Promise.all([
      decidir(versaoId, { decisao: 'aprovado' }),
      decidir(versaoId, { decisao: 'reprovado', justificativa: 'Não.' }),
    ])

    expect(respostas.map((r) => r.statusCode).sort()).toEqual([200, 409])
  })
})
