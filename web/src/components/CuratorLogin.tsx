import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import {
  api,
  clearCuratorToken,
  getApiErrorMessage,
  getStoredCuratorToken,
  setCuratorToken,
} from '../api'
import { ErrorBox } from './ErrorBox'

export function CuratorLogin({
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

      {error && (
        <div role="alert">
          <ErrorBox message={error} />
        </div>
      )}

      <form className="form-grid" onSubmit={validate} aria-busy={loading}>
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
