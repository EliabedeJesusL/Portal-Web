import type { Arquivos } from './validador.js'

type Entrada = { arquivos: Arquivos; entrada: string; bytes: number }

/**
 * Guarda os arquivos extraídos das últimas versões abertas no preview, para não
 * descompactar o zip a cada arquivo pedido. Limitado por bytes (o Render free tem 512 MB).
 */
export class CachePreview {
  private readonly itens = new Map<string, Entrada>()
  private total = 0

  constructor(private readonly limiteBytes = 64 * 1024 * 1024) {}

  get(versaoId: string) {
    const item = this.itens.get(versaoId)
    if (item) {
      // Reinsere para marcar como usado por último.
      this.itens.delete(versaoId)
      this.itens.set(versaoId, item)
    }
    return item
  }

  set(versaoId: string, arquivos: Arquivos, entrada: string) {
    let bytes = 0
    for (const conteudo of arquivos.values()) bytes += conteudo.byteLength

    const anterior = this.itens.get(versaoId)
    if (anterior) {
      this.itens.delete(versaoId)
      this.total -= anterior.bytes
    }

    const item = { arquivos, entrada, bytes }
    if (bytes > this.limiteBytes) return item

    while (this.total + bytes > this.limiteBytes) {
      const [maisAntigo] = this.itens.keys()
      this.total -= this.itens.get(maisAntigo!)!.bytes
      this.itens.delete(maisAntigo!)
    }
    this.itens.set(versaoId, item)
    this.total += bytes
    return item
  }
}
