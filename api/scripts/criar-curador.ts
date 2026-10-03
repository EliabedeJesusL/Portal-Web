/**
 * Cria um curador e imprime o token dele uma única vez.
 *
 *   npm run curador:criar -- "Nome do Curador"
 *
 * Usa a DATABASE_URL do ambiente (ou do .env). Para criar em produção, aponte
 * para o Supabase; o host usado é mostrado antes de criar.
 */
import { criarCurador } from '../src/auth/credenciais.js'
import { createDb } from '../src/db/client.js'

const nome = process.argv.slice(2).join(' ').trim()
if (!nome) {
  console.error('Uso: npm run curador:criar -- "Nome do Curador"')
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL.')
  process.exit(1)
}

console.log(`Banco: ${new URL(url).hostname}`)

const { db, close } = createDb(url)
try {
  const curador = await criarCurador(db, nome)
  console.log(`Curador criado: ${curador.nome} (${curador.id})`)
  console.log('')
  console.log(`  Token: ${curador.token}`)
  console.log('')
  console.log('Guarde o token agora: ele não é salvo e não pode ser mostrado de novo.')
} finally {
  await close()
}
