import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./test/support/global-setup.ts'],
    // Os arquivos compartilham o mesmo banco de testes.
    fileParallelism: false,
  },
})
