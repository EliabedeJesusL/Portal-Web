/**
 * Popula o banco local com dados de exemplo para desenvolvimento.
 * Pode ser rodado várias vezes: usa ids fixos e ignora o que já existe.
 *
 * Tokens de desenvolvimento (NÃO usar em produção):
 *   curador: dev-curador
 *   estação: dev-estacao
 */
import { createHash } from 'node:crypto'
import { strToU8, zipSync } from 'fflate'
import { hashToken } from '../src/auth/tokens.js'
import { createDb } from '../src/db/client.js'
import {
  curadores,
  estacoes,
  jogos,
  pacotes,
  partidas,
  versoes,
  votos,
} from '../src/db/schema/index.js'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL para rodar o seed.')
  process.exit(1)
}

const host = new URL(url).hostname
if (!['localhost', '127.0.0.1'].includes(host) && !process.argv.includes('--force')) {
  console.error(
    `DATABASE_URL aponta para "${host}", que não parece local. ` +
      'O seed cria tokens de desenvolvimento conhecidos; use --force se tiver certeza.',
  )
  process.exit(1)
}

const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex')

const IDS = {
  curador: '00000000-0000-4000-8000-000000000001',
  estacao: '00000000-0000-4000-8000-000000000002',
  versaoAprovada: '00000000-0000-4000-8000-000000000010',
  versaoSubmetida: '00000000-0000-4000-8000-000000000011',
}

// PNG 1x1 transparente.
const CAPA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

type JogoSeed = typeof jogos.$inferInsert & { id: string }

function montarPacote(jogo: JogoSeed, versao: string) {
  const manifesto = {
    id: jogo.id,
    nome: jogo.nome,
    versao,
    autores: jogo.autores,
    descricao: jogo.descricao,
    controles: jogo.controles,
    entrada: 'index.html',
    capa: 'capa.png',
    classico_referencia: jogo.classicoReferencia,
    mecanica: jogo.mecanica,
    tema: jogo.tema,
    nivel: jogo.nivel,
    questoes: 'questoes.json',
  }
  const questoes = {
    tema: jogo.tema,
    nivel: jogo.nivel,
    questoes: Array.from({ length: 20 }, (_, i) => ({
      id: `q${i + 1}`,
      enunciado: `Quanto é ${i + 1} + ${i + 1}?`,
      alternativas: [`${2 * (i + 1)}`, `${2 * (i + 1) + 1}`, `${i + 1}`, '0'],
      correta: 0,
      explicacao: `${i + 1} + ${i + 1} = ${2 * (i + 1)}.`,
      fonte: 'https://pt.wikipedia.org/wiki/Adição',
    })),
  }
  const index = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><title>${jogo.nome}</title></head>
  <body><h1>${jogo.nome}</h1><p>Jogo de exemplo gerado pelo seed.</p></body>
</html>
`
  const zip = Buffer.from(
    zipSync({
      'index.html': strToU8(index),
      'game.json': strToU8(JSON.stringify(manifesto, null, 2)),
      'questoes.json': strToU8(JSON.stringify(questoes, null, 2)),
      'capa.png': CAPA,
    }),
  )

  return { manifesto, zip, totalQuestoes: questoes.questoes.length }
}

const quizInvaders: JogoSeed = {
  id: 'quiz-invaders',
  nome: 'Quiz Invaders',
  descricao: 'Derrube as naves certas respondendo às questões de matemática.',
  resumo: 'Space Invaders com questões de matemática.',
  autores: ['Equipe Exemplo'],
  controles: 'Setas movem, espaço atira.',
  classicoReferencia: 'Space Invaders',
  mecanica: 'tiro',
  tema: 'Matemática',
  nivel: 'ensino médio',
  capa: 'capa.png',
  repositorioUrl: 'https://github.com/Arcade-IFES/quiz-invaders',
}

const labirinto: JogoSeed = {
  id: 'labirinto-da-historia',
  nome: 'Labirinto da História',
  descricao: 'Encontre a saída respondendo perguntas de história do Brasil.',
  autores: ['Equipe Exemplo'],
  controles: 'Setas movem.',
  classicoReferencia: 'Pac-Man',
  mecanica: 'labirinto',
  tema: 'História',
  nivel: 'ensino fundamental',
  capa: 'capa.png',
  repositorioUrl: 'https://github.com/Arcade-IFES/labirinto-da-historia',
}

// Partidas do Quiz Invaders; o último jogo de cada jogador leva o voto.
const JOGADORES = [
  { jogador: 'ANA', pontos: [1200, 1500], nota: 5 },
  { jogador: 'BRUNO', pontos: [900], nota: 4 },
  { jogador: 'CAIO42', pontos: [1800, 700, 1100], nota: 3 },
]

const { db, close } = createDb(url)

try {
  await db.transaction(async (tx) => {
    await tx
      .insert(curadores)
      .values({ id: IDS.curador, nome: 'Curador Dev', tokenHash: hashToken('dev-curador') })
      .onConflictDoNothing()
    await tx
      .insert(estacoes)
      .values({ id: IDS.estacao, nome: 'Estação Dev', tokenHash: hashToken('dev-estacao') })
      .onConflictDoNothing()

    await tx.insert(jogos).values([quizInvaders, labirinto]).onConflictDoNothing()

    const versoesSeed = [
      { id: IDS.versaoAprovada, jogo: quizInvaders, versao: '1.0.0', estado: 'aprovado' as const },
      { id: IDS.versaoSubmetida, jogo: labirinto, versao: '0.1.0', estado: 'submetido' as const },
    ]
    for (const { id, jogo, versao, estado } of versoesSeed) {
      const { manifesto, zip, totalQuestoes } = montarPacote(jogo, versao)
      const aprovada = estado === 'aprovado'
      await tx
        .insert(versoes)
        .values({
          id,
          jogoId: jogo.id,
          versao,
          estado,
          ref: `v${versao}`,
          commitSha: sha256(`${jogo.id}@${versao}`).slice(0, 40),
          tamanhoBytes: zip.length,
          sha256: sha256(zip),
          manifesto,
          totalQuestoes,
          decididoPor: aprovada ? IDS.curador : null,
          decididoEm: aprovada ? new Date() : null,
        })
        .onConflictDoNothing()
      await tx.insert(pacotes).values({ versaoId: id, conteudo: zip }).onConflictDoNothing()
    }

    let n = 0
    for (const { jogador, pontos, nota } of JOGADORES) {
      let ultimaPartida = ''
      for (const p of pontos) {
        n += 1
        ultimaPartida = `00000000-0000-4000-8000-${String(100 + n).padStart(12, '0')}`
        await tx
          .insert(partidas)
          .values({
            idPartida: ultimaPartida,
            jogoId: quizInvaders.id,
            jogador,
            pontos: p,
            duracaoS: 60 + n * 10,
            acertos: Math.round(p / 100),
            erros: n % 4,
            tema: 'Matemática',
            jogadoEm: new Date(Date.UTC(2026, 8, 20, 14, n)),
            estacaoId: IDS.estacao,
          })
          .onConflictDoNothing()
      }
      await tx
        .insert(votos)
        .values({ jogoId: quizInvaders.id, jogador, idPartida: ultimaPartida, nota })
        .onConflictDoNothing()
    }
  })

  console.log('Seed aplicado.')
  console.log('  Token de curador (dev): dev-curador')
  console.log('  Token de estação (dev): dev-estacao')
} finally {
  await close()
}
