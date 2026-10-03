import { AppError } from '../errors.js'

export type Repositorio = { owner: string; repo: string }

export type GithubClient = {
  /** Resolve uma tag, branch ou SHA para o SHA completo do commit. */
  resolverRef(repositorio: Repositorio, ref: string): Promise<string>
  /** Baixa o zip do commit, abortando se passar de `limiteBytes`. */
  baixarZip(repositorio: Repositorio, sha: string, limiteBytes: number): Promise<Buffer>
}

const NOME_VALIDO = /^[A-Za-z0-9_.-]+$/

/** Aceita `https://github.com/<dono>/<repo>`, com ou sem `.git` e barra final. */
export function parseRepositorioUrl(url: string): Repositorio {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    throw repositorioInvalido()
  }

  const partes = parsed.pathname.replace(/\/+$/, '').replace(/\.git$/, '').split('/').slice(1)
  const [owner, repo] = partes
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== 'github.com' ||
    partes.length !== 2 ||
    !owner ||
    !repo ||
    !NOME_VALIDO.test(owner) ||
    !NOME_VALIDO.test(repo)
  ) {
    throw repositorioInvalido()
  }

  return { owner, repo }
}

/** URL canônica usada para comparar repositórios (o GitHub ignora maiúsculas). */
export function urlCanonica({ owner, repo }: Repositorio) {
  return `https://github.com/${owner}/${repo}`.toLowerCase()
}

function repositorioInvalido(
  mensagem = 'Informe a URL de um repositório do GitHub, no formato https://github.com/<dono>/<repositorio>.',
) {
  return new AppError(422, 'REPOSITORIO_INVALIDO', mensagem)
}

function githubIndisponivel(detalhe: string) {
  return new AppError(
    503,
    'GITHUB_INDISPONIVEL',
    `Não foi possível falar com o GitHub (${detalhe}). Tente de novo em alguns minutos.`,
  )
}

export function pacoteGrande(limiteBytes: number) {
  const mb = Math.round(limiteBytes / 1024 / 1024)
  return new AppError(
    422,
    'PACOTE_GRANDE',
    `O repositório passa de ${mb} MB compactado. Remova arquivos que o jogo não usa (vídeos, fontes do projeto, builds antigos).`,
  )
}

type Options = {
  token?: string
  fetch?: typeof globalThis.fetch
  timeoutMs?: number
}

export function createGithubClient({
  token,
  fetch = globalThis.fetch,
  timeoutMs = 60_000,
}: Options = {}): GithubClient {
  const headers: Record<string, string> = {
    'User-Agent': 'recreio-arcade-plataforma-gestao',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  async function chamar(url: string, accept: string) {
    try {
      return await fetch(url, {
        headers: { ...headers, Accept: accept },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (err) {
      throw githubIndisponivel(err instanceof Error ? err.message : 'erro de rede')
    }
  }

  return {
    async resolverRef({ owner, repo }, ref) {
      // Codifica cada segmento, mas mantém as barras de refs como `release/1.0`.
      const refPath = ref.split('/').map(encodeURIComponent).join('/')
      const response = await chamar(
        `https://api.github.com/repos/${owner}/${repo}/commits/${refPath}`,
        'application/vnd.github.sha',
      )

      if (response.ok) return (await response.text()).trim()

      if (response.status === 404) {
        // 404 vem tanto de repositório inexistente/privado quanto de ref inexistente.
        const repoExiste = await chamar(
          `https://api.github.com/repos/${owner}/${repo}`,
          'application/vnd.github+json',
        )
        if (repoExiste.status === 404) {
          throw repositorioInvalido(
            `O repositório ${owner}/${repo} não existe ou é privado. Ele precisa ser público.`,
          )
        }
        if (!repoExiste.ok) throw githubIndisponivel(`HTTP ${repoExiste.status}`)
      }
      if (response.status === 404 || response.status === 422) {
        throw new AppError(
          422,
          'REF_NAO_ENCONTRADA',
          `A ref "${ref}" não existe em ${owner}/${repo}. Crie a tag (ex.: git tag v1.0.0 && git push --tags) ou confira o nome.`,
        )
      }
      if (response.status === 403 || response.status === 429) {
        throw githubIndisponivel('limite de requisições atingido')
      }
      throw githubIndisponivel(`HTTP ${response.status}`)
    },

    async baixarZip({ owner, repo }, sha, limiteBytes) {
      // O codeload não conta no limite de requisições da API.
      const response = await chamar(
        `https://codeload.github.com/${owner}/${repo}/zip/${sha}`,
        'application/zip',
      )
      if (!response.ok || !response.body) throw githubIndisponivel(`HTTP ${response.status}`)

      const declarado = Number(response.headers.get('content-length'))
      if (declarado > limiteBytes) {
        await response.body.cancel()
        throw pacoteGrande(limiteBytes)
      }

      const partes: Uint8Array[] = []
      let total = 0
      const reader = response.body.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > limiteBytes) {
          await reader.cancel()
          throw pacoteGrande(limiteBytes)
        }
        partes.push(value)
      }
      return Buffer.concat(partes)
    },
  }
}
