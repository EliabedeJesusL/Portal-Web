import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { App } from '../src/app.js'
import { AppError } from '../src/errors.js'
import { createTestApp } from './support/app.js'

describe('formato de erro', () => {
  let app: App

  beforeAll(async () => {
    app = await createTestApp()

    app.post(
      '/teste/validacao',
      { schema: { body: z.object({ nome: z.string().min(1) }) } },
      async () => ({ ok: true }),
    )
    app.get('/teste/app-error', async () => {
      throw new AppError(409, 'JA_DECIDIDA', 'Esta versão já foi decidida.')
    })
    app.get('/teste/inesperado', async () => {
      throw new Error('detalhe interno que não deve vazar')
    })

    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('responde 404 com NAO_ENCONTRADO para rota inexistente', async () => {
    const response = await app.inject({ method: 'GET', url: '/nao-existe' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      codigo: 'NAO_ENCONTRADO',
      erro: 'Rota GET /nao-existe não existe.',
    })
  })

  it('responde 400 com REQUISICAO_INVALIDA indicando o campo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/teste/validacao',
      payload: { nome: '' },
    })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.codigo).toBe('REQUISICAO_INVALIDA')
    expect(body.erro).toContain('body')
    expect(body.erro).toContain('nome')
  })

  it('usa status e código do AppError', async () => {
    const response = await app.inject({ method: 'GET', url: '/teste/app-error' })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      codigo: 'JA_DECIDIDA',
      erro: 'Esta versão já foi decidida.',
    })
  })

  it('esconde a mensagem de erros inesperados', async () => {
    const response = await app.inject({ method: 'GET', url: '/teste/inesperado' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      codigo: 'ERRO_INTERNO',
      erro: 'Erro interno no servidor. Tente novamente mais tarde.',
    })
  })

  it('traduz os erros de requisição do Fastify', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/teste/validacao',
      headers: { 'content-type': 'text/xml' },
      payload: '<nome/>',
    })

    expect(response.statusCode).toBe(415)
    expect(response.json()).toEqual({
      codigo: 'REQUISICAO_INVALIDA',
      erro: 'Content-Type não suportado. Envie application/json.',
    })
  })

  it('responde 400 para JSON malformado', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/teste/validacao',
      headers: { 'content-type': 'application/json' },
      payload: '{',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      codigo: 'REQUISICAO_INVALIDA',
      erro: 'O corpo da requisição não é um JSON válido.',
    })
  })
})
