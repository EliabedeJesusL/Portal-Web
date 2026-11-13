import { useEffect, useState } from 'react'
import { Gamepad2, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, getApiErrorMessage, type Game } from '../api'
import { ErrorBox } from '../components/ErrorBox'
import { GameCard } from '../components/GameCard'
import { Layout, Loading } from '../components/Layout'

export function Catalogo() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.jogos()
      .then(setGames)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="CATÁLOGO" eyebrow="PLATAFORMA DE GESTÃO">
      <section className="panel">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <Gamepad2 size={15} /> JOGOS APROVADOS
            </span>
            <p>Somente versões aprovadas pela curadoria são publicadas aqui.</p>
          </div>
          <Link
            className="arcade-button arcade-button--yellow"
            to="/enviar"
          >
            <UploadCloud size={17} /> ENVIAR JOGO
          </Link>
        </div>

        {error ? (
          <ErrorBox message={error} />
        ) : loading ? (
          <Loading />
        ) : games.length === 0 ? (
          <div className="panel panel--center">NENHUM JOGO APROVADO.</div>
        ) : (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
