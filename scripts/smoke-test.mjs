const base = process.env.API_URL || 'http://localhost:3000'

async function check(path, options = {}) {
  const response = await fetch(`${base}${path}`, options)
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status} ${text}`)
  }
  console.log(`[OK] ${path}`)
  return text ? JSON.parse(text) : null
}

await check('/health')
const games = await check('/api/jogos')
console.log(`[INFO] Jogos aprovados: ${games.length}`)

if (process.env.CURATOR_TOKEN) {
  await check('/api/curadores/eu', {
    headers: { Authorization: `Bearer ${process.env.CURATOR_TOKEN}` },
  })
}

console.log('Smoke test concluído.')
