import { createHash, randomBytes } from 'node:crypto'

export type TipoToken = 'curador' | 'estacao'

const PREFIXOS: Record<TipoToken, string> = {
  curador: 'cur_',
  estacao: 'est_',
}

/** Gera um token aleatório (256 bits). O prefixo só ajuda a reconhecer o tipo. */
export function gerarToken(tipo: TipoToken) {
  return PREFIXOS[tipo] + randomBytes(32).toString('base64url')
}

/** Hash SHA-256 em hex; é o que fica guardado no banco. */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
