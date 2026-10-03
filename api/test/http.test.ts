import { afterEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { createTestApp } from './support/app.js'

describe('CORS, rate limit e documentação', () => {
  let app: App | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  async function iniciar(env: Record<string, string> = {}) {
    app = await createTestApp({ env })
    await app.ready()
    return app
  }

  describe('CORS', () => {
    it('libera qualquer origem por padrão e expõe os cabeçalhos do download', async () => {
      const app = await iniciar()

      const response = await app.inject({
        method: 'GET',
        url: '/api/jogos',
        headers: { origin: 'https://portal.exemplo.com' },
      })

      expect(response.headers['access-control-allow-origin']).toBe('*')
      expect(response.headers['access-control-expose-headers']).toContain('X-Sha256')
    })

    it('responde ao preflight do navegador com Authorization liberado', async () => {
      const app = await iniciar()

      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/versoes/00000000-0000-4000-8000-000000000000/decisao',
        headers: {
          origin: 'https://portal.exemplo.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization,content-type',
        },
      })

      expect(response.statusCode).toBe(204)
      expect(response.headers['access-control-allow-methods']).toContain('POST')
      expect(response.headers['access-control-allow-headers']).toContain('Authorization')
    })

    it('com CORS_ORIGINS, só libera as origens da lista', async () => {
      const app = await iniciar({ CORS_ORIGINS: 'https://portal.exemplo.com' })
      const pedir = (origin: string) =>
        app.inject({ method: 'GET', url: '/health', headers: { origin } })

      const permitida = await pedir('https://portal.exemplo.com')
      const outra = await pedir('https://outro.com')

      expect(permitida.headers['access-control-allow-origin']).toBe('https://portal.exemplo.com')
      expect(outra.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('rate limit da submissão', () => {
    it('dá 429 MUITAS_REQUISICOES depois do limite, por IP', async () => {
      const app = await iniciar({ LIMITE_SUBMISSOES: '2' })
      // URL inválida: falha antes de ir ao GitHub, mas conta para o limite.
      const submeter = (ip: string) =>
        app.inject({
          method: 'POST',
          url: '/api/jogos',
          remoteAddress: ip,
          payload: { repositorio_url: 'https://gitlab.com/a/b', ref: 'v1.0.0' },
        })

      const respostas = [await submeter('10.0.0.1'), await submeter('10.0.0.1'), await submeter('10.0.0.1')]
      const outroIp = await submeter('10.0.0.2')

      expect(respostas.map((r) => r.statusCode)).toEqual([422, 422, 429])
      expect(respostas[2]!.json()).toEqual({
        codigo: 'MUITAS_REQUISICOES',
        erro: expect.stringMatching(/^Muitas requisições seguidas\. Tente de novo em \d+ s\.$/),
      })
      expect(respostas[2]!.headers['retry-after']).toBeDefined()
      expect(outroIp.statusCode).toBe(422)
    })

    it('não limita as outras rotas', async () => {
      const app = await iniciar({ LIMITE_SUBMISSOES: '1' })

      for (let i = 0; i < 5; i++) {
        const response = await app.inject({ method: 'GET', url: '/api/jogos' })
        expect(response.statusCode).toBe(200)
      }
    })
  })

  describe('documentação', () => {
    it('serve o Swagger em /docs e o OpenAPI em /docs/json', async () => {
      const app = await iniciar()

      const pagina = await app.inject({ method: 'GET', url: '/docs' })
      const spec = await app.inject({ method: 'GET', url: '/docs/json' })

      expect([200, 302]).toContain(pagina.statusCode)
      expect(spec.statusCode).toBe(200)
      const openapi = spec.json()
      expect(openapi.info.title).toContain('Recreio Arcade')
      expect(Object.keys(openapi.paths)).toEqual(
        expect.arrayContaining(['/api/jogos', '/api/placares', '/api/ranking/jogos']),
      )
      expect(openapi.paths['/api/placares'].post.security).toEqual([{ estacao: [] }])
      expect(openapi.components.securitySchemes.curador.scheme).toBe('bearer')
    })
  })
})
