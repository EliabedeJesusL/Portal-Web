import { useState, type FormEvent } from 'react'
import { CheckCircle2, Github } from 'lucide-react'
import { api, getApiErrorMessage } from '../api'
import { ErrorBox } from '../components/ErrorBox'
import { Layout } from '../components/Layout'

export function Enviar() {
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
