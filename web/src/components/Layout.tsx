import { useEffect, useState, type ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

export function Layout({
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

// Estado de carregamento. Se a consulta demorar, avisa que a API pode estar
// "acordando" (cold start), para o usuário não achar que o portal travou.
export function Loading({ message = 'CONSULTANDO API...' }: { message?: string }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="panel panel--center" role="status">
      <div>{message}</div>
      {slow && (
        <small className="loading-hint">
          A API pode estar iniciando (hospedagem gratuita). Isso pode levar até
          1 minuto; aguarde.
        </small>
      )}
    </div>
  )
}
