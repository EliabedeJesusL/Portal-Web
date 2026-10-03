import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { unzipSync } from 'fflate'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { criarEstacao } from '../src/auth/credenciais.js'
import { partidas, versoes, votos } from '../src/db/schema/index.js'
import type { GithubClient } from '../src/github/cliente.js'
import { createTestApp } from './support/app.js'
import { limparBanco } from './support/db.js'
import { manifestoValido, zipDoGithub } from './support/pacote.js'

const ORIGEM = 'http://localhost:80'

describe('catálogo, download e preview', () => {
  let app: App
  let zipAtual: Buffer

  const github: GithubClient = {
    resolverRef: async () => 'd'.repeat(40),
    baixarZip: async () => zipAtual,
  }

  beforeAll(async () => {
    app = await createTestApp({ github })
    await app.ready()
  })

  beforeEach(async () => {
    await limparBanco(app.db)
  })

  afterAll(async () => {
    await app.close()
  })

  /** Submete uma versão pela API e, se pedido, muda o estado direto no banco. */
  async function publicar(
    versao: string,
    estado: 'submetido' | 'aprovado' | 'substituida' | 'reprovado' = 'aprovado',
    manifesto: Record<string, unknown> = {},
  ) {
    zipAtual = zipDoGithub({ 'game.json': manifestoValido({ versao, ...manifesto }) })
    const response = await app.inject({
      method: 'POST',
      url: '/api/jogos',
      payload: {
        repositorio_url: `https://github.com/equipe/${String(manifesto.id ?? 'quiz-teste')}`,
        ref: `v${versao}`,
      },
    })
    expect(response.statusCode).toBe(201)
    const game = response.json()
    if (estado !== 'submetido') {
      await app.db.update(versoes).set({ estado }).where(eq(versoes.id, game.versao_id))
    }
    return game as { versao_id: string; sha256: string; tamanho_bytes: number }
  }

  describe('GET /api/jogos', () => {
    it('lista só os aprovados por padrão, com as URLs públicas', async () => {
      const aprovada = await publicar('1.0.0', 'aprovado')
      await publicar('1.0.0', 'submetido', { id: 'outro-jogo' })

      const response = await app.inject({ method: 'GET', url: '/api/jogos' })

      expect(response.statusCode).toBe(200)
      const lista = response.json()
      expect(lista).toHaveLength(1)
      expect(lista[0]).toMatchObject({
        id: 'quiz-teste',
        status: 'aprovado',
        versao_id: aprovada.versao_id,
        sha256: aprovada.sha256,
        tamanho_bytes: aprovada.tamanho_bytes,
        capa_url: `${ORIGEM}/api/versoes/${aprovada.versao_id}/preview/capa.png`,
        preview_url: `${ORIGEM}/api/versoes/${aprovada.versao_id}/preview/index.html`,
        pacote_url: `${ORIGEM}/api/jogos/quiz-teste/pacote?versao=1.0.0`,
      })
    })

    it('filtra por status, focando a versão daquele estado', async () => {
      await publicar('1.0.0', 'aprovado')
      const pendente = await publicar('1.1.0', 'submetido')

      const response = await app.inject({ method: 'GET', url: '/api/jogos?status=submetido' })

      const lista = response.json()
      expect(lista).toHaveLength(1)
      expect(lista[0]).toMatchObject({ versao: '1.1.0', versao_id: pendente.versao_id })
      expect(lista[0].pacote_url).toBeUndefined()
      expect(lista[0].versoes).toHaveLength(2)
    })

    it('usa https e o host do proxy quando vem X-Forwarded-*', async () => {
      await publicar('1.0.0')

      const response = await app.inject({
        method: 'GET',
        url: '/api/jogos',
        headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'api.exemplo.com' },
      })

      expect(response.json()[0].capa_url).toMatch(/^https:\/\/api\.exemplo\.com\/api\/versoes\//)
    })

    it('rejeita status desconhecido', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/jogos?status=publicado' })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/jogos/:id', () => {
    it('inclui estatísticas, feedbacks e taxa de acerto por tema', async () => {
      await publicar('1.0.0')
      const estacao = await criarEstacao(app.db, 'Estação')
      const partida = (idPartida: string, jogador: string, tema: string, acertos: number, erros: number) => ({
        idPartida,
        jogoId: 'quiz-teste',
        jogador,
        pontos: 100,
        duracaoS: 60,
        acertos,
        erros,
        tema,
        jogadoEm: new Date(),
        estacaoId: estacao.id,
      })
      const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']
      await app.db.insert(partidas).values([
        partida(ids[0]!, 'ANA', 'Matemática', 8, 2),
        partida(ids[1]!, 'BIA', 'Matemática', 1, 2),
      ])
      await app.db.insert(votos).values([
        { jogoId: 'quiz-teste', jogador: 'ANA', idPartida: ids[0]!, nota: 5, comentario: 'Muito bom' },
        { jogoId: 'quiz-teste', jogador: 'BIA', idPartida: ids[1]!, nota: 2 },
      ])

      const response = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste' })

      expect(response.statusCode).toBe(200)
      const detalhe = response.json()
      expect(detalhe).toMatchObject({
        nota_media: 3.5,
        votos: 2,
        jogadores_distintos: 2,
        partidas_jogadas: 2,
        taxa_acerto_tema: [{ tema: 'Matemática', acertos: 9, erros: 4, taxa: 69.2 }],
      })
      expect(detalhe.feedbacks).toHaveLength(2)
      expect(detalhe.feedbacks).toContainEqual(
        expect.objectContaining({ apelido: 'ANA', nota: 5, comentario: 'Muito bom' }),
      )
    })

    it('mostra jogo que ainda não foi aprovado', async () => {
      await publicar('1.0.0', 'submetido')

      const response = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste' })

      expect(response.statusCode).toBe(200)
      expect(response.json().status).toBe('submetido')
    })

    it('dá 404 JOGO_NAO_ENCONTRADO', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/jogos/nao-existe' })

      expect(response.statusCode).toBe(404)
      expect(response.json().codigo).toBe('JOGO_NAO_ENCONTRADO')
    })
  })

  describe('GET /api/jogos/:id/pacote', () => {
    it('baixa o zip da versão aprovada com ETag e X-Sha256', async () => {
      const aprovada = await publicar('1.0.0')

      const response = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste/pacote' })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('application/zip')
      expect(response.headers['etag']).toBe(`"${aprovada.sha256}"`)
      expect(response.headers['x-sha256']).toBe(aprovada.sha256)
      expect(response.headers['x-versao']).toBe('1.0.0')
      expect(response.headers['content-disposition']).toContain('quiz-teste-1.0.0.zip')
      expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(aprovada.sha256)
      expect(Object.keys(unzipSync(response.rawPayload))).toContain('index.html')
    })

    it('responde 304 quando o If-None-Match confere', async () => {
      const aprovada = await publicar('1.0.0')

      const response = await app.inject({
        method: 'GET',
        url: '/api/jogos/quiz-teste/pacote',
        headers: { 'if-none-match': `W/"outro", "${aprovada.sha256}"` },
      })

      expect(response.statusCode).toBe(304)
      expect(response.rawPayload).toHaveLength(0)
    })

    it('baixa uma versão substituída pelo número', async () => {
      await publicar('1.0.0', 'substituida')
      await publicar('1.1.0', 'aprovado')

      const antiga = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste/pacote?versao=1.0.0' })
      const atual = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste/pacote' })

      expect(antiga.headers['x-versao']).toBe('1.0.0')
      expect(antiga.headers['cache-control']).toContain('immutable')
      expect(atual.headers['x-versao']).toBe('1.1.0')
      expect(atual.headers['cache-control']).toContain('no-cache')
    })

    it('não entrega versão submetida', async () => {
      await publicar('1.0.0', 'submetido')

      const semVersao = await app.inject({ method: 'GET', url: '/api/jogos/quiz-teste/pacote' })
      const comVersao = await app.inject({
        method: 'GET',
        url: '/api/jogos/quiz-teste/pacote?versao=1.0.0',
      })

      expect(semVersao.statusCode).toBe(404)
      expect(semVersao.json().codigo).toBe('PACOTE_NAO_ENCONTRADO')
      expect(comVersao.statusCode).toBe(404)
    })
  })

  describe('GET /api/versoes/:id/preview/*', () => {
    it('serve a entrada do jogo na raiz, isolada por CSP', async () => {
      const { versao_id } = await publicar('1.0.0', 'submetido')

      const response = await app.inject({
        method: 'GET',
        url: `/api/versoes/${versao_id}/preview/`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8')
      expect(response.body).toContain('<title>Quiz Teste</title>')
      expect(response.headers['content-security-policy']).toContain('sandbox allow-scripts')
      expect(response.headers['access-control-allow-origin']).toBe('*')
    })

    it('serve arquivos de subpastas com o tipo certo', async () => {
      const { versao_id } = await publicar('1.0.0', 'submetido')

      const js = await app.inject({ method: 'GET', url: `/api/versoes/${versao_id}/preview/js/jogo.js` })
      const png = await app.inject({ method: 'GET', url: `/api/versoes/${versao_id}/preview/capa.png` })

      expect(js.headers['content-type']).toBe('text/javascript; charset=utf-8')
      expect(js.body).toBe('console.log("oi")')
      expect(png.headers['content-type']).toBe('image/png')
    })

    it('redireciona para a barra final', async () => {
      const { versao_id } = await publicar('1.0.0', 'submetido')

      const response = await app.inject({ method: 'GET', url: `/api/versoes/${versao_id}/preview` })

      expect(response.statusCode).toBe(301)
      expect(response.headers.location).toBe(`/api/versoes/${versao_id}/preview/`)
    })

    it('dá 404 para arquivo ou versão inexistente', async () => {
      const { versao_id } = await publicar('1.0.0', 'submetido')

      const arquivo = await app.inject({
        method: 'GET',
        url: `/api/versoes/${versao_id}/preview/nao-existe.js`,
      })
      const versao = await app.inject({
        method: 'GET',
        url: '/api/versoes/00000000-0000-4000-8000-000000000000/preview/',
      })

      expect(arquivo.statusCode).toBe(404)
      expect(versao.statusCode).toBe(404)
    })
  })
})
