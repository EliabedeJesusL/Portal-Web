import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { App } from '../app.js'
import { pacotes, versoes } from '../db/schema/index.js'
import { AppError } from '../errors.js'
import { CachePreview } from '../pacotes/cache.js'
import { extrairZip, type Manifesto } from '../pacotes/validador.js'

const TIPOS: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  md: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  webm: 'video/webm',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  wasm: 'application/wasm',
}

function tipoDe(caminho: string) {
  const extensao = caminho.split('.').pop()?.toLowerCase() ?? ''
  return TIPOS[extensao] ?? 'application/octet-stream'
}

function naoEncontrado(mensagem: string): never {
  throw new AppError(404, 'NAO_ENCONTRADO', mensagem)
}

export async function previewRoutes(app: App) {
  const cache = new CachePreview()

  async function carregar(versaoId: string) {
    const emCache = cache.get(versaoId)
    if (emCache) return emCache

    const [linha] = await app.db
      .select({ manifesto: versoes.manifesto, conteudo: pacotes.conteudo })
      .from(versoes)
      .innerJoin(pacotes, eq(pacotes.versaoId, versoes.id))
      .where(eq(versoes.id, versaoId))
    if (!linha) naoEncontrado(`A versão ${versaoId} não existe.`)

    const entrada = (linha.manifesto as Manifesto).entrada.replace(/^(\.\/)+/, '')
    return cache.set(versaoId, extrairZip(linha.conteudo), entrada)
  }

  const params = z.object({ id: z.uuid(), '*': z.string().optional() })

  // Sem a barra final, os caminhos relativos do jogo (js/jogo.js) resolveriam errado.
  app.get(
    '/api/versoes/:id/preview',
    {
      schema: {
        tags: ['Curadoria'],
        summary: 'Redireciona para /preview/',
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => reply.redirect(`/api/versoes/${request.params.id}/preview/`, 301),
  )

  app.get(
    '/api/versoes/:id/preview/*',
    {
      schema: {
        tags: ['Curadoria'],
        summary: 'Serve os arquivos do pacote de qualquer versão, para jogar antes de decidir',
        params,
      },
    },
    async (request, reply) => {
      const { arquivos, entrada } = await carregar(request.params.id)

      let caminho = request.params['*'] || entrada
      if (caminho.endsWith('/')) caminho += 'index.html'
      const conteudo = arquivos.get(caminho)
      if (!conteudo) naoEncontrado(`O arquivo "${caminho}" não existe no pacote.`)

      return (
        reply
          .type(tipoDe(caminho))
          // O conteúdo de uma versão nunca muda.
          .header('Cache-Control', 'public, max-age=86400')
          .header('X-Content-Type-Options', 'nosniff')
          // O jogo é código de terceiros servido no domínio da API: roda numa origem
          // isolada, sem acesso ao que for da API.
          .header('Content-Security-Policy', 'sandbox allow-scripts allow-pointer-lock')
          // Na origem isolada, o fetch do próprio jogo (ex.: questoes.json) vira cross-origin.
          .header('Access-Control-Allow-Origin', '*')
          .send(Buffer.from(conteudo))
      )
    },
  )
}
