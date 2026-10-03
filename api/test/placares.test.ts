import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { App } from '../src/app.js'
import { criarCurador, criarEstacao } from '../src/auth/credenciais.js'
import { jogos, partidas, votos } from '../src/db/schema/index.js'
import { createTestApp } from './support/app.js'
import { limparBanco } from './support/db.js'

const JOGO = {
  id: 'quiz-teste',
  nome: 'Quiz Teste',
  descricao: 'Descrição',
  autores: ['Fulana'],
  controles: 'Setas',
  classicoReferencia: 'Space Invaders',
  mecanica: 'tiro',
  tema: 'Matemática',
  nivel: 'ensino médio',
  capa: 'capa.png',
  repositorioUrl: 'https://github.com/equipe/quiz-teste',
}

describe('POST /api/placares', () => {
  let app: App
  let tokenEstacao: string
  let estacaoId: string

  beforeAll(async () => {
    app = await createTestApp()
    await app.ready()
  })

  beforeEach(async () => {
    await limparBanco(app.db)
    await app.db.insert(jogos).values(JOGO)
    const estacao = await criarEstacao(app.db, 'Fliperama 1')
    tokenEstacao = estacao.token
    estacaoId = estacao.id
  })

  afterAll(async () => {
    await app.close()
  })

  function placar(extra: Record<string, unknown> = {}) {
    return {
      id_partida: randomUUID(),
      jogo: 'quiz-teste',
      versao: '1.1.0',
      jogador: 'ANA',
      pontos: 1450,
      duracao_s: 95,
      acertos: 8,
      erros: 2,
      tema: 'Matemática',
      jogado_em: '2026-09-23T14:30:00-03:00',
      ...extra,
    }
  }

  function enviar(payload: Record<string, unknown>, url = '/api/placares', token = tokenEstacao) {
    return app.inject({
      method: 'POST',
      url,
      headers: { authorization: `Bearer ${token}` },
      payload,
    })
  }

  it('grava a partida nova com 201', async () => {
    const dados = placar()

    const response = await enviar(dados)

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      ok: true,
      duplicada: false,
      partida: {
        id_partida: dados.id_partida,
        jogo: 'quiz-teste',
        jogador: 'ANA',
        pontos: 1450,
        duracao_s: 95,
        acertos: 8,
        erros: 2,
        tema: 'Matemática',
        jogado_em: '2026-09-23T17:30:00.000Z',
      },
      voto: null,
    })
    const [salva] = await app.db.select().from(partidas)
    expect(salva!.estacaoId).toBe(estacaoId)
  })

  it('responde 200 sem duplicar quando a mesma partida chega de novo', async () => {
    const dados = placar({ feedback: { nota: 5 } })
    await enviar(dados)

    const response = await enviar({ ...dados, pontos: 9999, feedback: { nota: 1 } })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      duplicada: true,
      partida: { pontos: 1450 },
      voto: { nota: 5 },
    })
    expect(await app.db.select().from(partidas)).toHaveLength(1)
    expect(await app.db.select().from(votos)).toHaveLength(1)
  })

  it('dá 409 quando o id_partida já é de outro jogo', async () => {
    const dados = placar()
    await enviar(dados)
    await app.db.insert(jogos).values({ ...JOGO, id: 'outro-jogo' })

    const response = await enviar({ ...dados, jogo: 'outro-jogo' })

    expect(response.statusCode).toBe(409)
    expect(response.json().codigo).toBe('PARTIDA_CONFLITANTE')
  })

  it('guarda um voto por jogador e jogo: o mais recente vale', async () => {
    await enviar(placar({ feedback: { nota: 2, comentario: 'difícil' } }))
    const segunda = placar({ feedback: { nota: 5 } })

    const response = await enviar(segunda)

    expect(response.json().voto).toEqual({ nota: 5 })
    const lista = await app.db.select().from(votos)
    expect(lista).toHaveLength(1)
    expect(lista[0]).toMatchObject({ jogador: 'ANA', nota: 5, comentario: null, idPartida: segunda.id_partida })
  })

  it('aceita o formato do mock do G2 (jogo_id, nota e comentario soltos) e o alias /api/resultados', async () => {
    const response = await enviar(
      { jogo_id: 'quiz-teste', jogador: 'BIA', pontos: 10, nota: 4, comentario: 'bom' },
      '/api/resultados',
    )

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      partida: { jogo: 'quiz-teste', jogador: 'BIA', duracao_s: 0, acertos: 0, erros: 0, tema: 'Matemática' },
      voto: { nota: 4, comentario: 'bom' },
    })
    expect(response.json().partida.id_partida).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('normaliza o apelido e arredonda os números', async () => {
    const response = await enviar(placar({ jogador: ' ze9 ', pontos: 10.6, duracao_s: 30.2 }))

    expect(response.json().partida).toMatchObject({ jogador: 'ZE9', pontos: 11, duracao_s: 30 })
  })

  it('grava como ANON quando o jogo não mandou apelido, e esses votos não se substituem', async () => {
    const { jogador: _, ...semApelido } = placar()
    await enviar({ ...semApelido, feedback: { nota: 3 } })
    await enviar({ ...placar(), jogador: undefined, feedback: { nota: 4 } })

    const lista = await app.db.select().from(votos).where(eq(votos.jogador, 'ANON'))
    expect(lista.map((v) => v.nota).sort()).toEqual([3, 4])
  })

  it.each([
    ['apelido com espaço', { jogador: 'ANA MARIA' }],
    ['apelido longo', { jogador: 'ABCDEFGHIJ' }],
    ['pontos negativos', { pontos: -1 }],
    ['nota fora de 1 a 5', { feedback: { nota: 6 } }],
    ['sem jogo', { jogo: undefined }],
    ['id_partida inválido', { id_partida: '123' }],
  ])('rejeita %s com 400', async (_, extra) => {
    const response = await enviar(placar(extra))

    expect(response.statusCode).toBe(400)
    expect(response.json().codigo).toBe('REQUISICAO_INVALIDA')
  })

  it('dá 404 para jogo inexistente', async () => {
    const response = await enviar(placar({ jogo: 'nao-existe' }))

    expect(response.statusCode).toBe(404)
    expect(response.json().codigo).toBe('JOGO_NAO_ENCONTRADO')
  })

  it('só aceita token de estação', async () => {
    const curador = await criarCurador(app.db, 'Curadora')

    const semToken = await app.inject({ method: 'POST', url: '/api/placares', payload: placar() })
    const comCurador = await enviar(placar(), '/api/placares', curador.token)

    expect(semToken.statusCode).toBe(401)
    expect(comCurador.statusCode).toBe(401)
    expect(await app.db.select().from(partidas)).toHaveLength(0)
  })
})
