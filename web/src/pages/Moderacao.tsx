import { useEffect, useState, type FormEvent } from 'react'
import { ExternalLink, Gamepad2, Github, ShieldCheck } from 'lucide-react'
import {
  api,
  clearCuratorToken,
  getApiErrorMessage,
  getStoredCuratorToken,
  type Game,
} from '../api'
import { CuratorLogin } from '../components/CuratorLogin'
import { ErrorBox } from '../components/ErrorBox'
import { Layout, Loading } from '../components/Layout'

export function Moderacao() {
  const [games, setGames] = useState<Game[]>([])
  const [selected, setSelected] = useState<Game | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [curatorName, setCuratorName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [stationName, setStationName] = useState('Fliperama principal')
  const [stationToken, setStationToken] = useState('')
  const [stations, setStations] = useState<Array<{ id: string; nome: string; criado_em: string }>>([])
  const [loadingStations, setLoadingStations] = useState(false)
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
    void load()

    // Restaura a sessão de curadoria validando novamente o token salvo na sessão.
    const token = getStoredCuratorToken()
    if (token) {
      api.validarCurador(token)
        .then((curator) => {
          setCuratorName(curator.nome)
          setMessage(`Sessão restaurada: ${curator.nome}.`)
          void loadStations()
        })
        .catch(() => {
          clearCuratorToken()
          setCuratorName('')
          setError('A sessão de curadoria não é válida. Informe novamente o token do curador.')
        })
    }
  }, [])

  async function loadStations() {
    if (!getStoredCuratorToken()) {
      setStations([])
      return
    }
    try {
      setLoadingStations(true)
      setStations(await api.listarEstacoes())
      setError('')
    } catch (e) {
      setError(`Não foi possível carregar as estações: ${getApiErrorMessage(e)}`)
    } finally {
      setLoadingStations(false)
    }
  }

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
    setError('')
    await loadStations()
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
      setError('')
      await loadStations()
    } catch (e) {
      setMessage(getApiErrorMessage(e))
    } finally {
      setCreatingStation(false)
    }
  }

  function logout() {
    clearCuratorToken()
    setCuratorName('')
    setStations([])
    setStationToken('')
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
          <div className="station-list">
            <h3>ESTAÇÕES CADASTRADAS</h3>
            {loadingStations ? (
              <p>Carregando estações...</p>
            ) : stations.length === 0 ? (
              <p>Nenhuma estação cadastrada ainda.</p>
            ) : (
              <ul>
                {stations.map((station) => (
                  <li key={station.id}>
                    <strong>{station.nome}</strong>
                    <small>Criada em {new Date(station.criado_em).toLocaleString('pt-BR')}</small>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="text-button" onClick={() => void loadStations()} disabled={loadingStations}>
              ATUALIZAR ESTAÇÕES
            </button>
          </div>
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

      <div className="message message--warning" role="note">
        <ShieldCheck size={22} />
        <div>
          <strong>Aviso de governança (RF-G15)</strong>
          <p>
            Autores não devem avaliar nem decidir sobre as próprias submissões.
            Se você é autor de uma versão da fila, peça a outro curador que
            faça a análise.
          </p>
        </div>
      </div>

      {message && <p className="inline-message curator-global-message">{message}</p>}
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
                  sandbox="allow-scripts"
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

              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  )
}
