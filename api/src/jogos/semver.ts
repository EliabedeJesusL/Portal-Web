/**
 * Compara versões semver (1.2.3 e 1.2.3-beta.1). Devolve < 0, 0 ou > 0.
 * Uma pré-versão vem antes da versão final de mesmo número.
 */
export function compararVersoes(a: string, b: string) {
  const [numA = '', preA] = a.split('-', 2)
  const [numB = '', preB] = b.split('-', 2)
  const partesA = numA.split('.').map(Number)
  const partesB = numB.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const diferenca = (partesA[i] ?? 0) - (partesB[i] ?? 0)
    if (diferenca !== 0) return diferenca
  }

  if (preA === preB) return 0
  if (preA === undefined) return 1
  if (preB === undefined) return -1
  return preA.localeCompare(preB, 'en', { numeric: true })
}
