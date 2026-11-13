import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { api } from '../api'

// Estados do indicador da API. "starting" = ainda tentando (cold start).
type ApiStatus = 'checking' | 'starting' | 'online' | 'offline'

// Em hospedagem gratuita a API pode levar ~60 s para acordar (cold start).
// Tentamos de 5 em 5 segundos, até 12 vezes, antes de dizer que está offline.
const RETRY_MS = 5000
const MAX_ATTEMPTS = 12

const STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'API...',
  starting: 'API INICIANDO...',
  online: 'API ONLINE',
  offline: 'API OFFLINE',
}

export function Header() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function check(attempt: number) {
      api.health()
        .then(() => {
          if (!cancelled) setStatus('online')
        })
        .catch(() => {
          if (cancelled) return
          if (attempt >= MAX_ATTEMPTS) {
            setStatus('offline')
            return
          }
          setStatus('starting')
          timer = setTimeout(() => check(attempt + 1), RETRY_MS)
        })
    }

    check(1)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
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

        <div
          className="header-status"
          role="status"
          title={
            status === 'starting'
              ? 'A API está iniciando (hospedagem gratuita). Pode levar até 1 minuto.'
              : undefined
          }
        >
          <span
            className={`status-dot ${
              status === 'online'
                ? 'is-online'
                : status === 'offline'
                  ? 'is-offline'
                  : status === 'starting'
                    ? 'is-starting'
                    : ''
            }`}
          />
          <span>{STATUS_LABEL[status]}</span>
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
