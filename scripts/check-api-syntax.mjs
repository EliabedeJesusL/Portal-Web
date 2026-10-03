import { spawnSync } from 'node:child_process'
const result = spawnSync(process.execPath, ['--check', 'api/src/server.js'], { stdio: 'inherit' })
process.exit(result.status ?? 1)
