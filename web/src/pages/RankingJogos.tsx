import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { api, getApiErrorMessage, type GameRank } from '../api'
import { ErrorBox } from '../components/ErrorBox'
import { FormulaModal } from '../components/FormulaModal'
import { Layout, Loading } from '../components/Layout'

export function RankingJogos() {
  const [ranking, setRanking] = useState<GameRank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.rankingJogos()
      .then(setRanking)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="RANKING DE JOGOS" eyebrow="RF-G08 / RF-G14">
      <section className="panel">
        <FormulaModal />

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} />
        ) : ranking.length === 0 ? (
          <div className="panel panel--center">NENHUM JOGO NO RANKING.</div>
        ) : (
          <div className="ranking-list">
            {ranking.map((item) => (
              <div
                className="ranking-row ranking-row--game"
                key={item.jogo_id}
              >
                <strong className="rank-position">#{item.posicao}</strong>
                <span className="rank-name">
                  <strong>{item.jogo}</strong>
                  <small>
                    {item.votos} votos • {item.partidas} partidas •{' '}
                    {item.jogadores_distintos} jogadores
                  </small>
                </span>
                <span>
                  <Star size={15} /> {item.nota.toFixed(1)}/5
                </span>
                <strong>{item.nota_ajustada.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
