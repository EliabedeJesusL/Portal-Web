import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ExternalLink,
  Gamepad2,
  Github,
  Star,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, getApiErrorMessage, type Game } from '../api'
import { ErrorBox } from '../components/ErrorBox'
import { Layout, Loading } from '../components/Layout'

export function Detalhes() {
  const { id } = useParams()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    setLoading(true)
    api.jogo(id)
      .then(setGame)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <Layout title="DETALHES"><Loading /></Layout>
  }

  if (error) {
    return <Layout title="DETALHES"><ErrorBox message={error} /></Layout>
  }

  if (!game) {
    return <Layout title="DETALHES"><ErrorBox message="Jogo não encontrado." /></Layout>
  }

  return (
    <Layout title={game.nome} eyebrow="DETALHE DO JOGO">
      <section className="panel">
        <Link className="back-link" to="/catalogo">
          <ChevronLeft size={18} /> VOLTAR AO CATÁLOGO
        </Link>

        <div className="detail-grid">
          <div className="detail-cover">
            {game.capa_url ? (
              <img src={game.capa_url} alt={`Capa de ${game.nome}`} />
            ) : (
              <Gamepad2 size={76} />
            )}
            <span>V{game.versao}</span>
          </div>

          <div>
            <div className="tag-row">
              <span>{game.tema}</span>
              <span>{game.nivel}</span>
              <span>
                {game.classico_referencia || 'Clássico não informado'}
              </span>
            </div>

            <h2 className="detail-title">{game.nome}</h2>
            <p className="lead">{game.resumo}</p>

            <div className="detail-meta">
              <span>
                <Users size={16} /> {game.autores.join(', ')}
              </span>
              <span>
                <Star size={16} /> {game.nota_media.toFixed(1)}/5 •{' '}
                {game.votos} votos
              </span>
            </div>

            <h3>Descrição</h3>
            <p>{game.descricao}</p>

            <h3>Mecânica</h3>
            <p>{game.mecanica || 'Não informado pela API.'}</p>

            <h3>Controles</h3>
            <p className="code-like">{game.controles}</p>

            {game.repositorio_url && (
              <a
                className="external-link"
                href={game.repositorio_url}
                target="_blank"
                rel="noreferrer"
              >
                <Github size={17} /> REPOSITÓRIO <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h3>VERSÕES</h3>
          <div className="version-list">
            {(game.versoes || []).map((version) => (
              <div className="version-row" key={version.id}>
                <strong>v{version.versao}</strong>
                <span className={`badge badge--${version.estado}`}>
                  {version.estado}
                </span>
                <small>
                  {version.submetido_em
                    ? new Date(version.submetido_em).toLocaleDateString('pt-BR')
                    : 'Data não informada'}
                </small>
                {version.justificativa && <span>{version.justificativa}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="detail-grid detail-grid--secondary">
          <div className="detail-section">
            <h3>FEEDBACK DOS JOGADORES</h3>
            {(game.feedbacks || []).length === 0 ? (
              <p>Nenhum feedback recebido.</p>
            ) : (
              (game.feedbacks || []).map((feedback, index) => (
                <article
                  className="feedback"
                  key={`${feedback.apelido}-${index}`}
                >
                  <div>
                    <strong>{feedback.nota}/5</strong> • {feedback.apelido}
                  </div>
                  <p>{feedback.comentario || 'Sem comentário.'}</p>
                </article>
              ))
            )}
          </div>

          <div className="detail-section">
            <h3>TAXA DE ACERTO POR TEMA</h3>
            {(game.taxa_acerto_tema || []).map((item) => (
              <div className="accuracy-row" key={item.tema}>
                <span>{item.tema}</span>
                <strong>{item.taxa.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
