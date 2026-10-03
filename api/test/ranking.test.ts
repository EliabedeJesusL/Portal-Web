import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { criarCurador, criarEstacao } from '../src/auth/credenciais.js'
import { anonimizacoes, jogos, partidas, versoes, votos } from '../src/db/schema/index.js'
import { createTestApp } from './support/app.js'
import { limparBanco } from './support/db.js'

function jogo(id: string, nome: string) {
  return {
    id,
    nome,
    descricao: 'Descrição',
    autores: ['Fulana'],
    controles: 'Setas',
    classicoReferencia: 'Pac-Man',
    mecanica: 'labirinto',
    tema: 'Matemática',
    nivel: 'ensino médio',
    capa: 'capa.png',
    repositorioUrl: `https://github.com/equipe/${id}`,
  }
}

function versao(jogoId: string, estado: 'aprovado' | 'submetido') {
  return {
    jogoId,
    versao: '1.0.0',
    estado,
    ref: 'v1.0.0',
    commitSha: 'a'.repeat(40),
    tamanhoBytes: 100,
    sha256: 'b'.repeat(64),
    manifesto: {},
    totalQuestoes: 20,
  }
}

describe('rankings', () => {
  let app: App
  let estacaoId: string
  let tokenCurador: string
  let minuto = 0

  beforeAll(async () => {
    app = await createTestApp()
    await app.ready()
  })

  beforeEach(async () => {
    await limparBanco(app.db)
    await app.db
      .insert(jogos)
      .values([jogo('alfa', 'Alfa'), jogo('beta', 'Beta'), jogo('pendente', 'Pendente')])
    await app.db
      .insert(versoes)
      .values([versao('alfa', 'aprovado'), versao('beta', 'aprovado'), versao('pendente', 'submetido')])
    estacaoId = (await criarEstacao(app.db, 'Estação')).id
    tokenCurador = (await criarCurador(app.db, 'Curadora')).token
    minuto = 0
  })

  afterAll(async () => {
    await app.close()
  })

  /** Grava uma partida (e o voto, se houver); cada chamada é um minuto depois da anterior. */
  async function jogar(jogoId: string, jogador: string, pontos: number, nota?: number) {
    const idPartida = randomUUID()
    minuto += 1
    await app.db.insert(partidas).values({
      idPartida,
      jogoId,
      jogador,
      pontos,
      duracaoS: 60,
      acertos: 5,
      erros: 1,
      tema: 'Matemática',
      jogadoEm: new Date(Date.UTC(2026, 8, 23, 12, minuto)),
      estacaoId,
    })
    if (nota) await app.db.insert(votos).values({ jogoId, jogador, idPartida, nota })
  }

  const get = (url: string) => app.inject({ method: 'GET', url })

  describe('GET /api/ranking/jogadores', () => {
    it('conta a melhor partida de cada apelido, só do jogo pedido', async () => {
      await jogar('alfa', 'ANA', 100)
      await jogar('alfa', 'ANA', 300)
      await jogar('alfa', 'BIA', 200)
      await jogar('beta', 'CAIO', 999)

      const response = await get('/api/ranking/jogadores?jogo=alfa')

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual([
        expect.objectContaining({ posicao: 1, apelido: 'ANA', pontos: 300, partidas: 2, jogo_id: 'alfa', jogo: 'Alfa' }),
        expect.objectContaining({ posicao: 2, apelido: 'BIA', pontos: 200, partidas: 1 }),
      ])
    })

    it('desempata por quem fez a pontuação primeiro', async () => {
      await jogar('alfa', 'BIA', 500)
      await jogar('alfa', 'ANA', 500)

      const lista = (await get('/api/ranking/jogadores?jogo=alfa')).json()

      expect(lista.map((r: { apelido: string }) => r.apelido)).toEqual(['BIA', 'ANA'])
    })

    it('deixa partidas ANON de fora', async () => {
      await jogar('alfa', 'ANON', 9999)
      await jogar('alfa', 'ANA', 10)

      const lista = (await get('/api/ranking/jogadores?jogo=alfa')).json()

      expect(lista.map((r: { apelido: string }) => r.apelido)).toEqual(['ANA'])
    })

    it('respeita o limite', async () => {
      for (const [i, apelido] of ['A', 'B', 'C'].entries()) await jogar('alfa', apelido, 100 - i)

      const lista = (await get('/api/ranking/jogadores?jogo=alfa&limite=2')).json()

      expect(lista).toHaveLength(2)
    })

    it('exige o jogo (não há ranking geral)', async () => {
      const response = await get('/api/ranking/jogadores')

      expect(response.statusCode).toBe(400)
      expect(response.json().erro).toContain('?jogo=')
    })

    it('dá 404 para jogo inexistente', async () => {
      const response = await get('/api/ranking/jogadores?jogo=nao-existe')

      expect(response.statusCode).toBe(404)
      expect(response.json().codigo).toBe('JOGO_NAO_ENCONTRADO')
    })
  })

  describe('GET /api/ranking/jogos', () => {
    it('ordena pela nota ajustada e só lista jogos aprovados', async () => {
      // Alfa: um único voto 5. Beta: dez votos com média 4,8 (oito 5 e dois 4).
      await jogar('alfa', 'A1', 10, 5)
      for (let i = 0; i < 10; i++) await jogar('beta', `B${i}`, 10, i < 8 ? 5 : 4)
      await jogar('pendente', 'P1', 10, 1)

      const lista = (await get('/api/ranking/jogos')).json()

      // C = média de todos os votos = (5 + 48 + 1) / 12 = 4,5
      // Alfa: 1/6·5 + 5/6·4,5 ≈ 4,58; Beta: 10/15·4,8 + 5/15·4,5 = 4,70
      const C = 54 / 12
      const ajustada = (v: number, R: number) => Math.round(((v / (v + 5)) * R + (5 / (v + 5)) * C) * 100) / 100
      expect(lista).toEqual([
        {
          posicao: 1,
          jogo_id: 'beta',
          jogo: 'Beta',
          nota: 4.8,
          votos: 10,
          partidas: 10,
          jogadores_distintos: 10,
          nota_ajustada: ajustada(10, 4.8),
        },
        {
          posicao: 2,
          jogo_id: 'alfa',
          jogo: 'Alfa',
          nota: 5,
          votos: 1,
          partidas: 1,
          jogadores_distintos: 1,
          nota_ajustada: ajustada(1, 5),
        },
      ])
    })

    it('sem votos, usa 3 e desempata por jogadores distintos e partidas', async () => {
      await jogar('alfa', 'ANA', 10)
      await jogar('beta', 'ANA', 10)
      await jogar('beta', 'BIA', 10)

      const lista = (await get('/api/ranking/jogos')).json()

      expect(lista.map((r: { jogo_id: string }) => r.jogo_id)).toEqual(['beta', 'alfa'])
      expect(lista[0]).toMatchObject({ nota: 0, votos: 0, nota_ajustada: 3 })
    })
  })

  describe('POST /api/ranking/jogadores/anonimizar', () => {
    function anonimizar(payload: Record<string, unknown>, token: string | null = tokenCurador) {
      return app.inject({
        method: 'POST',
        url: '/api/ranking/jogadores/anonimizar',
        headers: token ? { authorization: `Bearer ${token}` } : {},
        payload,
      })
    }

    it('troca o apelido por ANON em todos os jogos e tira do ranking', async () => {
      await jogar('alfa', 'ANA', 300, 5)
      await jogar('beta', 'ANA', 100, 4)
      await jogar('alfa', 'BIA', 200)

      const response = await anonimizar({ apelido: 'ana' })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        ok: true,
        apelido_anterior: 'ANA',
        apelido_novo: 'ANON',
        partidas: 2,
        votos: 2,
      })
      const ranking = (await get('/api/ranking/jogadores?jogo=alfa')).json()
      expect(ranking.map((r: { apelido: string }) => r.apelido)).toEqual(['BIA'])
    })

    it('pode se limitar a um jogo', async () => {
      await jogar('alfa', 'ANA', 300)
      await jogar('beta', 'ANA', 100)

      await anonimizar({ apelido: 'ANA', jogo: 'alfa' })

      expect((await get('/api/ranking/jogadores?jogo=alfa')).json()).toEqual([])
      expect((await get('/api/ranking/jogadores?jogo=beta')).json()).toHaveLength(1)
    })

    it('permite anonimizar dois jogadores que votaram no mesmo jogo', async () => {
      await jogar('alfa', 'ANA', 10, 5)
      await jogar('alfa', 'BIA', 10, 3)

      expect((await anonimizar({ apelido: 'ANA' })).statusCode).toBe(200)
      expect((await anonimizar({ apelido: 'BIA' })).statusCode).toBe(200)

      // As notas continuam valendo para o ranking de jogos.
      const [alfa] = (await get('/api/ranking/jogos')).json()
      expect(alfa).toMatchObject({ jogo_id: 'alfa', votos: 2, nota: 4 })
    })

    it('registra a anonimização sem guardar o apelido', async () => {
      await jogar('alfa', 'ANA', 10, 5)

      await anonimizar({ apelido: 'ANA' })

      const [registro] = await app.db.select().from(anonimizacoes)
      expect(registro).toMatchObject({ jogoId: null, partidasAfetadas: 1, votosAfetados: 1 })
      expect(JSON.stringify(registro)).not.toContain('ANA')
    })

    it('dá 404 quando o apelido não existe', async () => {
      const response = await anonimizar({ apelido: 'NINGUEM' })

      expect(response.statusCode).toBe(404)
      expect(response.json().codigo).toBe('APELIDO_NAO_ENCONTRADO')
      expect(await app.db.select().from(anonimizacoes)).toHaveLength(0)
    })

    it('rejeita ANON e apelido fora da regra', async () => {
      expect((await anonimizar({ apelido: 'ANON' })).statusCode).toBe(400)
      expect((await anonimizar({ apelido: 'ana maria' })).statusCode).toBe(400)
    })

    it('exige curador', async () => {
      await jogar('alfa', 'ANA', 10)

      const response = await anonimizar({ apelido: 'ANA' }, null)

      expect(response.statusCode).toBe(401)
      expect((await get('/api/ranking/jogadores?jogo=alfa')).json()).toHaveLength(1)
    })
  })
})
