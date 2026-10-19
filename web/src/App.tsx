import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Gamepad2,
  Github,
  KeyRound,
  Menu,
  ShieldCheck,
  Star,
  UploadCloud,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import {
  Link,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import {
  api,
  clearCuratorToken,
  getApiErrorMessage,
  getStoredCuratorToken,
  setCuratorToken,
  type Game,
  type GameRank,
  type PlayerRank,
} from './api'
import './styles.css'

function Header() {
  const [open, setOpen] = useState(false)
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    api.health()
      .then(() => setOnline(true))
      .catch(() => setOnline(false))
  }, [])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" to="/">
          <span>RECREIO</span>
          <strong>ARCADE</strong>
        </Link>

        <nav className={`main-nav ${open ? 'main-nav--open' : ''}`}>
          <NavLink to="/catalogo" onClick={() => setOpen(false)}>
            Catálogo
          </NavLink>
          <NavLink to="/ranking/jogadores" onClick={() => setOpen(false)}>
            Jogadores
          </NavLink>
          <NavLink to="/ranking/jogos" onClick={() => setOpen(false)}>
            Jogos
          </NavLink>
          <NavLink to="/enviar" onClick={() => setOpen(false)}>
            Enviar
          </NavLink>
          <NavLink to="/moderacao" onClick={() => setOpen(false)}>
            Curadoria
          </NavLink>
        </nav>

        <div className="header-status">
          <span
            className={`status-dot ${
              online === true
                ? 'is-online'
                : online === false
                  ? 'is-offline'
                  : ''
            }`}
          />
          <span>
            {online === true
              ? 'API ONLINE'
              : online === false
                ? 'API OFFLINE'
                : 'API...'}
          </span>
        </div>

        <button
          className="menu-button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>RECREIO ARCADE • PORTAL G2</span>
      <span>Dados e rankings vêm da API da plataforma</span>
    </footer>
  )
}

function Layout({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
}) {
  // Cada página ganha um título próprio na aba do navegador e nos resultados do Google.
  useEffect(() => {
    document.title = `${title} — Recreio Arcade`
  }, [title])

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-heading">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="message message--error">
      <XCircle size={22} />
      <div>
        <strong>Não foi possível concluir a operação.</strong>
        <p>{message}</p>
      </div>
    </div>
  )
}

function Loading() {
  return <div className="panel panel--center">CONSULTANDO API...</div>
}

function GameCard({ game }: { game: Game }) {
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

function Catalogo() {
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

function Detalhes() {
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

function Enviar() {
  const [form, setForm] = useState({
    repositorio_url: '',
    ref: 'v1.0.0',
    resumo: '',
  })
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setState('sending')
    setMessage('')

    try {
      await api.submeterJogo({
        repositorio_url: form.repositorio_url.trim(),
        ref: form.ref.trim(),
        resumo: form.resumo.trim() || undefined,
      })

      setState('success')
      setMessage('Submissão enviada. O jogo entrou na fila de curadoria.')
      setForm({
        repositorio_url: '',
        ref: 'v1.0.0',
        resumo: '',
      })
    } catch (error) {
      setState('error')
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <Layout title="ENVIAR JOGO" eyebrow="SUBMISSÃO">
      <section className="panel">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <Github size={15} /> SUBMISSÃO POR REPOSITÓRIO
            </span>
            <p>
              O Portal envia apenas o repositório, a tag da versão e um resumo
              opcional. Os demais dados vêm do game.json do jogo.
            </p>
          </div>
        </div>

        {state === 'success' && (
          <div className="message message--success">
            <CheckCircle2 size={22} />
            <span>{message}</span>
          </div>
        )}

        {state === 'error' && <ErrorBox message={message} />}

        <form className="form-grid" onSubmit={submit}>
          <label className="field--wide">
            URL DO REPOSITÓRIO GITHUB
            <input
              type="url"
              value={form.repositorio_url}
              onChange={(e) => update('repositorio_url', e.target.value)}
              placeholder="https://github.com/usuario/repositorio"
              pattern="https://(www\.)?github\.com/[^/]+/[^/]+/?"
              required
            />
            <small>
              O repositório precisa ser público e conter o jogo no formato
              exigido pelo G1.
            </small>
          </label>

          <label>
            TAG / REF DA VERSÃO
            <input
              value={form.ref}
              onChange={(e) => update('ref', e.target.value)}
              placeholder="v1.0.0"
              required
            />
            <small>Exemplo: v1.0.0</small>
          </label>

          <label className="field--wide">
            RESUMO <span className="field-hint">(OPCIONAL)</span>
            <textarea
              value={form.resumo}
              maxLength={300}
              onChange={(e) => update('resumo', e.target.value)}
              placeholder="Resumo curto do jogo."
            />
            <small>{form.resumo.length}/300 caracteres.</small>
          </label>

          <div className="form-actions field--wide">
            <button
              className="arcade-button arcade-button--yellow"
              disabled={state === 'sending'}
            >
              {state === 'sending'
                ? 'ENVIANDO...'
                : 'ENVIAR PARA CURADORIA'}
            </button>
          </div>
        </form>
      </section>
    </Layout>
  )
}

function CuratorLogin({
  onValidated,
}: {
  onValidated: (name: string) => void
}) {
  const [token, setToken] = useState(getStoredCuratorToken())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function validate(event: FormEvent) {
    event.preventDefault()
    if (!token.trim()) {
      setError('Informe o token do curador.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const curator = await api.validarCurador(token)
      setCuratorToken(token)
      onValidated(curator.nome)
    } catch (e) {
      clearCuratorToken()
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            <KeyRound size={15} /> AUTENTICAÇÃO DE CURADOR
          </span>
          <p>
            Informe o token <code>cur_...</code> fornecido pela API do G1 para
            realizar decisões e anonimizações.
          </p>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      <form className="form-grid" onSubmit={validate}>
        <label className="field--wide">
          TOKEN DO CURADOR
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="cur_..."
            autoComplete="off"
            required
          />
        </label>
        <div className="form-actions field--wide">
          <button
            className="arcade-button arcade-button--yellow"
            disabled={loading}
          >
            {loading ? 'VALIDANDO...' : 'VALIDAR TOKEN'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Moderacao() {
  const [games, setGames] = useState<Game[]>([])
  const [selected, setSelected] = useState<Game | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [curatorName, setCuratorName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [stationName, setStationName] = useState('Fliperama principal')
  const [stationToken, setStationToken] = useState('')
  const [creatingStation, setCreatingStation] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setGames(await api.decisoesPendentes())
      setError('')
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function decide(decisao: 'aprovado' | 'reprovado') {
    if (!selected) return

    if (!getStoredCuratorToken()) {
      setMessage('Valide o token do curador antes de decidir.')
      return
    }

    if (decisao === 'reprovado' && !justificativa.trim()) {
      setMessage('A reprovação exige justificativa.')
      return
    }

    const versionId = selected.versao_id || selected.versoes?.find(
      (version) => version.estado === 'submetido',
    )?.id

    if (!versionId) {
      setMessage('A API não informou o identificador da versão.')
      return
    }

    try {
      await api.decidirVersao(versionId, {
        decisao,
        justificativa: justificativa.trim() || undefined,
      })
      setMessage(`Decisão registrada: ${decisao}.`)
      setSelected(null)
      setJustificativa('')
      await load()
    } catch (e) {
      setMessage(getApiErrorMessage(e))
    }
  }

  async function handleValidated(name: string) {
    setCuratorName(name)
    setMessage(`Curador autenticado: ${name}.`)
  }

  async function createStation(event: FormEvent) {
    event.preventDefault()
    if (!curatorName) {
      setMessage('Valide o token do curador antes de criar uma estação.')
      return
    }
    if (!stationName.trim()) {
      setMessage('Informe um nome para a estação.')
      return
    }
    try {
      setCreatingStation(true)
      setStationToken('')
      const result = await api.criarEstacao(stationName.trim())
      setStationToken(result.token)
      setMessage(`Estação \"${result.nome}\" criada. Guarde o token agora: ele não será exibido novamente.`)
    } catch (e) {
      setMessage(getApiErrorMessage(e))
    } finally {
      setCreatingStation(false)
    }
  }

  function logout() {
    clearCuratorToken()
    setCuratorName('')
    setMessage('Token do curador removido desta sessão.')
  }

  return (
    <Layout title="CURADORIA" eyebrow="PAINEL DO CURADOR">
      <CuratorLogin onValidated={handleValidated} />

      {curatorName && (
        <section className="panel curator-session">
          <span>
            CURADOR AUTENTICADO: <strong>{curatorName}</strong>
          </span>
          <button className="text-button" onClick={logout}>
            SAIR
          </button>
        </section>
      )}

      {curatorName && (
        <section className="panel station-admin">
          <div className="section-head">
            <div>
              <span className="eyebrow">ESTAÇÕES DO FLIPERAMA</span>
              <p>Crie uma credencial própria para cada estação G3. O token aparece somente nesta resposta.</p>
            </div>
          </div>
          <form className="station-create-form" onSubmit={createStation}>
            <label>
              NOME DA ESTAÇÃO
              <input value={stationName} onChange={(e) => setStationName(e.target.value)} maxLength={100} required />
            </label>
            <button className="arcade-button arcade-button--green" type="submit" disabled={creatingStation}>
              {creatingStation ? 'CRIANDO...' : 'CRIAR ESTAÇÃO G3'}
            </button>
          </form>
          {stationToken && (
            <div className="message message--success station-token">
              <div>
                <strong>Token da estação — copie e guarde agora</strong>
                <code>{stationToken}</code>
                <p>Configure-o como TOKEN_ESTACAO no .env do G3. Não o envie ao GitHub nem o compartilhe publicamente.</p>
                <button type="button" className="text-button" onClick={() => navigator.clipboard?.writeText(stationToken)}>COPIAR TOKEN</button>
              </div>
            </div>
          )}
        </section>
      )}

      {error && <ErrorBox message={error} />}

      <section className="moderation-layout">
        <div className="panel moderation-list">
          <div className="section-head">
            <div>
              <span className="eyebrow">
                <ShieldCheck size={15} /> FILA
              </span>
              <p>Somente versões submetidas aguardam decisão.</p>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : games.length === 0 ? (
            <p>Nenhum jogo pendente.</p>
          ) : (
            games.map((game) => (
              <button
                className={`queue-item ${
                  selected?.id === game.id ? 'is-selected' : ''
                }`}
                key={`${game.id}-${game.versao_id || game.versao}`}
                onClick={() => setSelected(game)}
              >
                <strong>{game.nome}</strong>
                <span>
                  v{game.versao} • {game.autores.join(', ')}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="panel moderation-preview">
          {!selected ? (
            <div className="empty-preview">
              SELECIONE UM JOGO PARA ANALISAR
            </div>
          ) : (
            <>
              <div className="preview-head">
                <div>
                  <span className="eyebrow">PREVIEW DE CURADORIA</span>
                  <h2>{selected.nome}</h2>
                </div>
                {selected.repositorio_url && (
                  <a
                    className="external-link"
                    href={selected.repositorio_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github size={16} /> REPOSITÓRIO
                  </a>
                )}
              </div>

              {selected.preview_url ? (
                <iframe
                  className="preview-frame"
                  title={`Preview de ${selected.nome}`}
                  src={selected.preview_url}
                  sandbox="allow-scripts allow-forms"
                />
              ) : (
                <div className="preview-unavailable">
                  <Gamepad2 size={46} />
                  <p>
                    A API ainda não forneceu <code>preview_url</code> para esta
                    submissão.
                  </p>
                  {selected.repositorio_url && (
                    <a
                      className="external-link"
                      href={selected.repositorio_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ABRIR REPOSITÓRIO <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              <div className="decision-box">
                <div className="decision-curator">
                  CURADOR: <strong>{curatorName || 'NÃO AUTENTICADO'}</strong>
                </div>

                <label>
                  JUSTIFICATIVA
                  <textarea
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    placeholder="Obrigatória para reprovação."
                  />
                </label>

                <div className="decision-actions">
                  <button
                    className="arcade-button arcade-button--green"
                    onClick={() => decide('aprovado')}
                    disabled={!curatorName}
                  >
                    APROVAR
                  </button>
                  <button
                    className="arcade-button arcade-button--pink"
                    onClick={() => decide('reprovado')}
                    disabled={!curatorName}
                  >
                    REPROVAR
                  </button>
                </div>

                {message && <p className="inline-message">{message}</p>}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  )
}

function RankingJogadores() {
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

function RankingJogos() {
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
        <div className="ranking-explanation">
          <strong>Como a métrica funciona</strong>
          <p>
            A API calcula a nota ajustada pela média ponderada definida pelo
            G1. Com <code>m = 5</code>:
            {' '}
            <code>nota_ajustada = v/(v+m) · R + m/(v+m) · C</code>.
            Empates usam jogadores distintos e depois partidas.
          </p>
        </div>

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

function App() {
  return (
    <Routes>
      <Route path="*" element={<Catalogo />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/jogos/:id" element={<Detalhes />} />
      <Route path="/enviar" element={<Enviar />} />
      <Route path="/moderacao" element={<Moderacao />} />
      <Route path="/ranking/jogadores" element={<RankingJogadores />} />
      <Route path="/ranking/jogos" element={<RankingJogos />} />
    </Routes>
  )
}

export default App
