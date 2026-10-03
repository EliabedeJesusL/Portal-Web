import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { criarCurador, criarEstacao } from '../src/auth/credenciais.js'
import { exigirEstacao } from '../src/auth/guards.js'
import { gerarToken, hashToken } from '../src/auth/tokens.js'
import { curadores } from '../src/db/schema/index.js'
import { createTestApp } from './support/app.js'
import { limparBanco } from './support/db.js'

describe('tokens', () => {
  it('gera tokens aleatórios com o prefixo do tipo', () => {
    const a = gerarToken('curador')
    const b = gerarToken('curador')

    expect(a).toMatch(/^cur_[A-Za-z0-9_-]{43}$/)
    expect(gerarToken('estacao')).toMatch(/^est_/)
    expect(a).not.toBe(b)
  })

  it('gera o hash SHA-256 em hex', () => {
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

describe('autenticação', () => {
  let app: App
  let tokenCurador: string
  let curadorId: string
  let tokenEstacao: string

  beforeAll(async () => {
    app = await createTestApp()
    app.get('/teste/estacao', { onRequest: exigirEstacao }, async (request) => request.estacao)
    await app.ready()
  })

  beforeEach(async () => {
    await limparBanco(app.db)
    const curador = await criarCurador(app.db, 'Curadora Teste')
    tokenCurador = curador.token
    curadorId = curador.id
    tokenEstacao = (await criarEstacao(app.db, 'Estação Teste')).token
  })

  afterAll(async () => {
    await app.close()
  })

  const bearer = (token: string) => ({ authorization: `Bearer ${token}` })

  it('guarda só o hash do token', async () => {
    const [salvo] = await app.db.select().from(curadores)

    expect(salvo!.tokenHash).toBe(hashToken(tokenCurador))
    expect(salvo!.tokenHash).not.toContain(tokenCurador)
  })

  describe('GET /api/curadores/eu', () => {
    it('responde 401 NAO_AUTENTICADO sem o cabeçalho', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/curadores/eu' })

      expect(response.statusCode).toBe(401)
      expect(response.json().codigo).toBe('NAO_AUTENTICADO')
    })

    it('responde 401 NAO_AUTENTICADO para outro esquema', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/curadores/eu',
        headers: { authorization: `Basic ${tokenCurador}` },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().codigo).toBe('NAO_AUTENTICADO')
    })

    it('responde 401 TOKEN_INVALIDO para token desconhecido', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/curadores/eu',
        headers: bearer(gerarToken('curador')),
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({
        codigo: 'TOKEN_INVALIDO',
        erro: 'Token inválido ou revogado.',
      })
    })

    it('não aceita token de estação', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/curadores/eu',
        headers: bearer(tokenEstacao),
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().codigo).toBe('TOKEN_INVALIDO')
    })

    it('devolve o curador do token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/curadores/eu',
        headers: bearer(tokenCurador),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ id: curadorId, nome: 'Curadora Teste' })
    })
  })

  describe('guard de estação', () => {
    it('aceita token de estação', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/teste/estacao',
        headers: bearer(tokenEstacao),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().nome).toBe('Estação Teste')
    })

    it('não aceita token de curador', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/teste/estacao',
        headers: bearer(tokenCurador),
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().codigo).toBe('TOKEN_INVALIDO')
    })
  })

  describe('POST /api/estacoes', () => {
    it('exige curador', async () => {
      const semToken = await app.inject({
        method: 'POST',
        url: '/api/estacoes',
        payload: { nome: 'Fliperama 1' },
      })
      const comEstacao = await app.inject({
        method: 'POST',
        url: '/api/estacoes',
        headers: bearer(tokenEstacao),
        payload: { nome: 'Fliperama 1' },
      })

      expect(semToken.statusCode).toBe(401)
      expect(comEstacao.statusCode).toBe(401)
    })

    it('cria a estação e devolve um token que funciona', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/estacoes',
        headers: bearer(tokenCurador),
        payload: { nome: '  Fliperama 1  ' },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body).toMatchObject({ nome: 'Fliperama 1', token: expect.stringMatching(/^est_/) })
      expect(body.id).toBeTypeOf('string')
      expect(Number.isNaN(Date.parse(body.criado_em))).toBe(false)

      const uso = await app.inject({
        method: 'GET',
        url: '/teste/estacao',
        headers: bearer(body.token),
      })
      expect(uso.json()).toEqual({ id: body.id, nome: 'Fliperama 1' })
    })

    it('rejeita nome vazio', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/estacoes',
        headers: bearer(tokenCurador),
        payload: { nome: '   ' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().codigo).toBe('REQUISICAO_INVALIDA')
    })
  })

  describe('ordem dos erros', () => {
    it.each([
      ['/api/estacoes', {}],
      ['/api/versoes/00000000-0000-4000-8000-000000000000/decisao', {}],
      ['/api/placares', { pontos: -1 }],
    ])('POST %s sem token dá 401 antes de validar o corpo', async (url, payload) => {
      const response = await app.inject({ method: 'POST', url, payload })

      expect(response.statusCode).toBe(401)
      expect(response.json().codigo).toBe('NAO_AUTENTICADO')
    })
  })

  describe('GET /api/estacoes', () => {
    it('lista as estações sem os tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/estacoes',
        headers: bearer(tokenCurador),
      })

      expect(response.statusCode).toBe(200)
      const lista = response.json()
      expect(lista).toHaveLength(1)
      expect(lista[0]).toEqual({
        id: expect.any(String),
        nome: 'Estação Teste',
        criado_em: expect.any(String),
      })
    })

    it('exige curador', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/estacoes' })

      expect(response.statusCode).toBe(401)
    })
  })
})
