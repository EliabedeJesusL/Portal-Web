import { describe, expect, it } from 'vitest'
import { CachePreview } from '../src/pacotes/cache.js'

const arquivos = (bytes: number) => new Map([['a', new Uint8Array(bytes)]])

describe('CachePreview', () => {
  it('descarta as versões usadas há mais tempo ao passar do limite', () => {
    const cache = new CachePreview(100)
    cache.set('v1', arquivos(40), 'index.html')
    cache.set('v2', arquivos(40), 'index.html')
    cache.get('v1')
    cache.set('v3', arquivos(40), 'index.html')

    expect(cache.get('v1')).toBeDefined()
    expect(cache.get('v2')).toBeUndefined()
    expect(cache.get('v3')).toBeDefined()
  })

  it('não guarda um item maior que o limite, mas devolve para uso', () => {
    const cache = new CachePreview(100)

    const item = cache.set('grande', arquivos(200), 'index.html')

    expect(item.arquivos.size).toBe(1)
    expect(cache.get('grande')).toBeUndefined()
  })
})
