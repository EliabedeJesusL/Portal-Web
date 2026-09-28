export type EstadoVersao =
  | 'submetido'
  | 'aprovado'
  | 'reprovado'
  | 'substituida'

export type GameVersion = {
  id: string
  jogo_id?: string
  versao: string
  estado: EstadoVersao
  ref?: string
  commit_sha?: string
  submetido_em?: string
  decidido_em?: string
  decidido_por?: string
  justificativa?: string
  repositorio_url?: string
  preview_url?: string
  capa_url?: string
}

export type Feedback = {
  partida_id?: string
  apelido: string
  nota: number
  comentario?: string
  criado_em?: string
}

export type AccuracyByTheme = {
  tema: string
  acertos: number
  erros: number
  taxa: number
}

export type Game = {
  id: string
  nome: string
  descricao: string
  resumo: string
  classico_referencia?: string
  mecanica?: string
  tema: string
  nivel: string
  autores: string[]
  controles: string
  versao: string
  status: EstadoVersao
  capa?: string
  capa_url?: string
  tamanho_bytes?: number
  sha256?: string
  nota_media: number
  votos: number
  jogadores_distintos?: number
  partidas_jogadas?: number
  repositorio_url?: string
  preview_url?: string
  pacote_url?: string
  versao_id?: string
  current_version_id?: string
  versoes?: GameVersion[]
  feedbacks?: Feedback[]
  taxa_acerto_tema?: AccuracyByTheme[]
}

export type PlayerRank = {
  posicao: number
  apelido: string
  pontos: number
  jogo_id: string
  jogo: string
  acertos?: number
  erros?: number
  duracao_s?: number
  jogado_em?: string
  partidas?: number
}

export type GameRank = {
  posicao: number
  jogo_id: string
  jogo: string
  nota: number
  votos: number
  partidas: number
  jogadores_distintos: number
  nota_ajustada: number
}

export type Curador = {
  id: string
  nome: string
}

export type AnonimizacaoResponse = {
  ok: boolean
  apelido_anterior: string
  apelido_novo: string
  partidas?: number
  votos?: number
}

export type ApiErrorPayload = {
  codigo?: string
  erro?: string
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const CURATOR_TOKEN_KEY = 'recreio-arcade-curador-token'

function getCuratorToken() {
  return sessionStorage.getItem(CURATOR_TOKEN_KEY) || ''
}

export function getStoredCuratorToken() {
  return getCuratorToken()
}

export function clearCuratorToken() {
  sessionStorage.removeItem(CURATOR_TOKEN_KEY)
}

export function setCuratorToken(token: string) {
  sessionStorage.setItem(CURATOR_TOKEN_KEY, token.trim())
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Não foi possível concluir a operação.'
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(init.headers)

  headers.set('Accept', 'application/json')

  if (init.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const token = getCuratorToken()

    if (!token) {
      throw new Error('Token de curador não informado.')
    }

    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  })

  const body = await response.json().catch(() => null) as ApiErrorPayload | T | null

  if (!response.ok) {
    const errorBody = body as ApiErrorPayload | null
    const message =
      errorBody?.erro || `Erro HTTP ${response.status}`

    const error = new Error(message)
    Object.assign(error, {
      status: response.status,
      codigo: errorBody?.codigo,
    })
    throw error
  }

  return body as T
}

export const api = {
  health: () =>
    request<Game[]>('/jogos').then(() => ({
      ok: true,
      service: 'recreio-arcade-g1',
    })),

  jogos: (status?: string) =>
    request<Game[]>(status ? `/jogos?status=${encodeURIComponent(status)}` : '/jogos'),

  jogo: (id: string) =>
    request<Game>(`/jogos/${encodeURIComponent(id)}`),

  submeterJogo: (payload: {
    repositorio_url: string
    ref: string
    resumo?: string
  }) =>
    request<Game>('/jogos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  decisoesPendentes: () => request<Game[]>('/jogos?status=submetido'),

  validarCurador: (token: string) =>
    request<Curador>('/curadores/eu', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    }),

  decidirVersao: (
    versaoId: string,
    payload: {
      decisao: 'aprovado' | 'reprovado'
      justificativa?: string
    },
  ) =>
    request<Game>(
      `/versoes/${encodeURIComponent(versaoId)}/decisao`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true,
    ),

  rankingJogadores: (jogo: string, limite = 100) =>
    request<PlayerRank[]>(
      `/ranking/jogadores?jogo=${encodeURIComponent(jogo)}&limite=${limite}`,
    ),

  rankingJogos: () => request<GameRank[]>('/ranking/jogos'),

  anonimizarJogador: (apelido: string, jogo?: string) =>
    request<AnonimizacaoResponse>(
      '/ranking/jogadores/anonimizar',
      {
        method: 'POST',
        body: JSON.stringify({
          apelido,
          ...(jogo ? { jogo } : {}),
        }),
      },
      true,
    ),
}
