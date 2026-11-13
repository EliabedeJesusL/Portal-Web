import { useEffect, useState } from 'react'
import {
  api,
  getApiErrorMessage,
  getStoredCuratorToken,
  type Game,
  type PlayerRank,
} from '../api'
import { ErrorBox } from '../components/ErrorBox'
import { Layout, Loading } from '../components/Layout'

export function RankingJogadores() {
  const [ranking, setRanking] = useState<PlayerRank[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [gameId, setGameId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.jogos()
      .then(setGames)
      .catch((e) => setError(getApiErrorMessage(e)))
  }, [])

  useEffect(() => {
    if (!gameId) {
      setRanking([])
      return
    }

    setLoading(true)
    setError('')

    api.rankingJogadores(gameId)
      .then(setRanking)
      .catch((e) => {
        setRanking([])
        setError(getApiErrorMessage(e))
      })
      .finally(() => setLoading(false))
  }, [gameId])

  async function anonymize(apelido: string) {
    if (!getStoredCuratorToken()) {
      setMessage('A anonimização exige um token de curador.')
      return
    }

    try {
      const result = await api.anonimizarJogador(apelido, gameId)
      setMessage(
        `${result.apelido_anterior} foi anonimizado como ${result.apelido_novo}.`,
      )
      setRanking(await api.rankingJogadores(gameId))
    } catch (e) {
      setMessage(getApiErrorMessage(e))
    }
  }

  return (
    <Layout title="RANKING DE JOGADORES" eyebrow="RF-G07 / RF-G16">
      <section className="panel">
        <div className="toolbar">
          <label>
            SELECIONE O JOGO
            <select value={gameId} onChange={(e) => setGameId(e.target.value)}>
              <option value="">SELECIONE...</option>
              {games.map((game) => (
                <option value={game.id} key={game.id}>
                  {game.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!gameId ? (
          <div className="panel panel--center">
            SELECIONE UM JOGO PARA CONSULTAR O RANKING.
          </div>
        ) : loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} />
        ) : ranking.length === 0 ? (
          <div className="panel panel--center">
            NENHUMA PARTIDA NO RANKING DESTE JOGO.
          </div>
        ) : (
          <div className="ranking-list">
            {ranking.map((player) => (
              <div
                className="ranking-row"
                key={`${player.apelido}-${player.posicao}`}
              >
                <strong className="rank-position">#{player.posicao}</strong>
                <span className="rank-name">
                  <strong>{player.apelido}</strong>
                  <small>
                    {player.partidas ?? 0} partidas • melhor: {player.pontos.toLocaleString('pt-BR')}
                  </small>
                </span>
                <strong>{player.pontos.toLocaleString('pt-BR')}</strong>
                <button
                  className="text-button"
                  onClick={() => anonymize(player.apelido)}
                >
                  ANONIMIZAR
                </button>
              </div>
            ))}
          </div>
        )}

        {message && <p className="inline-message">{message}</p>}
      </section>
    </Layout>
  )
}
