import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { createTestApp } from './support/app.js'

describe.each(['/health', '/api/health'])('GET %s', (url) => {
  let app: App

  beforeAll(async () => {
    app = await createTestApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('responde 200 quando o banco está acessível', async () => {
    const response = await app.inject({ method: 'GET', url })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ok: true,
      service: 'plataforma-gestao-api',
      status: 'ok',
      banco: 'ok',
    })
  })
})

describe('GET /health sem banco', () => {
  let app: App

  beforeAll(async () => {
    // Porta sem nenhum Postgres escutando.
    app = await createTestApp({ databaseUrl: 'postgres://gestao:gestao@127.0.0.1:1/gestao' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('responde 503 com BANCO_INDISPONIVEL', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({
      codigo: 'BANCO_INDISPONIVEL',
      erro: 'Não foi possível conectar ao banco de dados.',
    })
  })
})
