import { Gamepad2, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Game } from '../api'

export function GameCard({ game }: { game: Game }) {
  return (
    <Link className="game-card" to={`/jogos/${game.id}`}>
      <div className="game-card__art">
        {game.capa_url ? (
          <img src={game.capa_url} alt={`Capa de ${game.nome}`} />
        ) : (
          <Gamepad2 size={48} />
        )}
        <span>APROVADO</span>
      </div>
      <div className="game-card__body">
        <h2>{game.nome}</h2>
        <p>{game.autores.join(' • ')}</p>
        <div className="game-card__meta">
          <span>{game.tema}</span>
          <span>{game.nivel}</span>
        </div>
        <div className="rating">
          <Star size={15} fill="currentColor" />
          {game.nota_media.toFixed(1)}/5
          <small>({game.votos} votos)</small>
        </div>
      </div>
    </Link>
  )
}
