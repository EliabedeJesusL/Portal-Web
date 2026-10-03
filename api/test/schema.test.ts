import { randomUUID } from 'node:crypto'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createDb } from '../src/db/client.js'
import { estacoes, jogos, partidas, versoes, votos } from '../src/db/schema/index.js'
import { TEST_DATABASE_URL } from './support/database.js'
import { limparBanco } from './support/db.js'

const { db, close } = createDb(TEST_DATABASE_URL)

const jogo = {
  id: 'jogo-teste',
  nome: 'Jogo Teste',
  descricao: 'Descrição',
  autores: ['Fulana'],
  controles: 'Setas',
  classicoReferencia: 'Pac-Man',
  mecanica: 'labirinto',
  tema: 'Matemática',
  nivel: 'ensino médio',
  capa: 'capa.png',
  repositorioUrl: 'https://github.com/exemplo/jogo-teste',
}

function novaVersao(versao: string, estado: 'submetido' | 'aprovado' | 'reprovado') {
  return {
    jogoId: jogo.id,
    versao,
    estado,
    ref: `v${versao}`,
    commitSha: 'a'.repeat(40),
    tamanhoBytes: 1024,
    sha256: 'b'.repeat(64),
    manifesto: {},
    totalQuestoes: 20,
  }
}

/** Erro do Postgres que o Drizzle embrulha em `cause`. */
async function erroDoBanco(promise: Promise<unknown>) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  return (err as { cause?: { constraint_name?: string } } | null)?.cause
}

beforeEach(async () => {
  await limparBanco(db)
  await db.insert(jogos).values(jogo)
})

afterAll(async () => {
  await close()
})

describe('versoes', () => {
  it('permite só uma versão aprovada por jogo', async () => {
    await db.insert(versoes).values(novaVersao('1.0.0', 'aprovado'))

    const cause = await erroDoBanco(db.insert(versoes).values(novaVersao('1.1.0', 'aprovado')))

    expect(cause?.constraint_name).toBe('versoes_uma_aprovada_por_jogo')
  })

  it('permite reenviar o mesmo número de uma versão reprovada', async () => {
    await db.insert(versoes).values(novaVersao('1.0.0', 'reprovado'))
    await db.insert(versoes).values(novaVersao('1.0.0', 'submetido'))

    const cause = await erroDoBanco(db.insert(versoes).values(novaVersao('1.0.0', 'submetido')))

    expect(cause?.constraint_name).toBe('versoes_numero_unico_por_jogo')
  })
})

describe('partidas e votos', () => {
  async function novaPartida(jogador: string) {
    const [estacao] = await db
      .insert(estacoes)
      .values({ nome: 'Estação', tokenHash: randomUUID() })
      .returning()
    const idPartida = randomUUID()
    await db.insert(partidas).values({
      idPartida,
      jogoId: jogo.id,
      jogador,
      pontos: 100,
      duracaoS: 60,
      acertos: 5,
      erros: 1,
      tema: 'Matemática',
      jogadoEm: new Date(),
      estacaoId: estacao!.id,
    })
    return idPartida
  }

  it('rejeita apelido fora de A-Z0-9 com até 9 caracteres', async () => {
    const cause = await erroDoBanco(novaPartida('apelido-invalido'))

    expect(cause?.constraint_name).toBe('partidas_jogador_valido')
  })

  it('aceita um voto por jogador, exceto os anonimizados', async () => {
    const voto = (idPartida: string, jogador: string) => ({
      jogoId: jogo.id,
      jogador,
      idPartida,
      nota: 5,
    })

    await db.insert(votos).values(voto(await novaPartida('ANA'), 'ANA'))
    const cause = await erroDoBanco(db.insert(votos).values(voto(await novaPartida('ANA'), 'ANA')))
    expect(cause?.constraint_name).toBe('votos_um_por_jogador')

    await db.insert(votos).values(voto(await novaPartida('ANON'), 'ANON'))
    await db.insert(votos).values(voto(await novaPartida('ANON'), 'ANON'))
  })

  it('rejeita nota fora de 1 a 5', async () => {
    const idPartida = await novaPartida('BIA')

    const cause = await erroDoBanco(
      db.insert(votos).values({ jogoId: jogo.id, jogador: 'BIA', idPartida, nota: 6 }),
    )

    expect(cause?.constraint_name).toBe('votos_nota_valida')
  })
})
