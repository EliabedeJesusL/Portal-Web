import { describe, expect, it } from 'vitest'
import { AppError } from '../src/errors.js'
import { createGithubClient, parseRepositorioUrl, urlCanonica } from '../src/github/cliente.js'

async function codigoDoErro(promise: Promise<unknown>) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(err).toBeInstanceOf(AppError)
  return (err as AppError).codigo
}

describe('parseRepositorioUrl', () => {
  it.each([
    'https://github.com/Arcade-IFES/Snake',
    'https://github.com/Arcade-IFES/Snake/',
    'https://github.com/Arcade-IFES/Snake.git',
    '  https://GitHub.com/Arcade-IFES/Snake  ',
  ])('aceita %s', (url) => {
    expect(parseRepositorioUrl(url)).toEqual({ owner: 'Arcade-IFES', repo: 'Snake' })
  })

  it.each([
    'github.com/Arcade-IFES/Snake',
    'http://github.com/Arcade-IFES/Snake',
    'https://gitlab.com/Arcade-IFES/Snake',
    'https://github.com/Arcade-IFES',
    'https://github.com/Arcade-IFES/Snake/tree/main',
    'não é url',
  ])('rejeita %s com REPOSITORIO_INVALIDO', (url) => {
    expect(() => parseRepositorioUrl(url)).toThrow(
      expect.objectContaining({ codigo: 'REPOSITORIO_INVALIDO' }),
    )
  })

  it('compara repositórios sem diferenciar maiúsculas', () => {
    expect(urlCanonica({ owner: 'Arcade-IFES', repo: 'Snake' })).toBe(
      urlCanonica({ owner: 'arcade-ifes', repo: 'snake' }),
    )
  })
})

type Rota = (url: string) => Response

function clienteCom(rota: Rota) {
  const chamadas: string[] = []
  const fetch = (async (input: string | URL | Request) => {
    const url = String(input)
    chamadas.push(url)
    return rota(url)
  }) as typeof globalThis.fetch
  return { cliente: createGithubClient({ fetch }), chamadas }
}

const repo = { owner: 'dono', repo: 'jogo' }

describe('resolverRef', () => {
  it('devolve o SHA do commit', async () => {
    const { cliente, chamadas } = clienteCom(() => new Response(`${'a'.repeat(40)}\n`))

    await expect(cliente.resolverRef(repo, 'v1.0.0')).resolves.toBe('a'.repeat(40))
    expect(chamadas).toEqual(['https://api.github.com/repos/dono/jogo/commits/v1.0.0'])
  })

  it('mantém as barras de refs como release/1.0', async () => {
    const { cliente, chamadas } = clienteCom(() => new Response('sha'))

    await cliente.resolverRef(repo, 'release/1.0')

    expect(chamadas[0]).toBe('https://api.github.com/repos/dono/jogo/commits/release/1.0')
  })

  it('dá REPOSITORIO_INVALIDO quando o repositório não existe', async () => {
    const { cliente } = clienteCom(() => new Response('', { status: 404 }))

    expect(await codigoDoErro(cliente.resolverRef(repo, 'v1.0.0'))).toBe('REPOSITORIO_INVALIDO')
  })

  it('dá REF_NAO_ENCONTRADA quando o repositório existe mas a ref não', async () => {
    const { cliente } = clienteCom((url) =>
      url.includes('/commits/') ? new Response('', { status: 404 }) : new Response('{}'),
    )

    expect(await codigoDoErro(cliente.resolverRef(repo, 'v9.9.9'))).toBe('REF_NAO_ENCONTRADA')
  })

  it('dá REF_NAO_ENCONTRADA para 422', async () => {
    const { cliente } = clienteCom(() => new Response('', { status: 422 }))

    expect(await codigoDoErro(cliente.resolverRef(repo, 'xyz'))).toBe('REF_NAO_ENCONTRADA')
  })

  it('dá GITHUB_INDISPONIVEL no limite de requisições', async () => {
    const { cliente } = clienteCom(() => new Response('', { status: 403 }))

    expect(await codigoDoErro(cliente.resolverRef(repo, 'v1.0.0'))).toBe('GITHUB_INDISPONIVEL')
  })

  it('dá GITHUB_INDISPONIVEL em erro de rede', async () => {
    const fetch = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof globalThis.fetch
    const cliente = createGithubClient({ fetch })

    expect(await codigoDoErro(cliente.resolverRef(repo, 'v1.0.0'))).toBe('GITHUB_INDISPONIVEL')
  })
})

describe('baixarZip', () => {
  it('baixa o zip do commit pelo codeload', async () => {
    const { cliente, chamadas } = clienteCom(() => new Response(new Uint8Array([1, 2, 3])))

    const zip = await cliente.baixarZip(repo, 'abc', 100)

    expect([...zip]).toEqual([1, 2, 3])
    expect(chamadas).toEqual(['https://codeload.github.com/dono/jogo/zip/abc'])
  })

  it('dá PACOTE_GRANDE pelo Content-Length', async () => {
    const { cliente } = clienteCom(
      () => new Response(new Uint8Array(10), { headers: { 'content-length': '1000' } }),
    )

    expect(await codigoDoErro(cliente.baixarZip(repo, 'abc', 100))).toBe('PACOTE_GRANDE')
  })

  it('dá PACOTE_GRANDE quando o corpo passa do limite sem Content-Length', async () => {
    const { cliente } = clienteCom(() => {
      const stream = new ReadableStream({
        start(controller) {
          for (let i = 0; i < 5; i++) controller.enqueue(new Uint8Array(50))
          controller.close()
        },
      })
      return new Response(stream)
    })

    expect(await codigoDoErro(cliente.baixarZip(repo, 'abc', 100))).toBe('PACOTE_GRANDE')
  })
})
