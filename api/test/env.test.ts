import { describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'

const DATABASE_URL = 'postgres://gestao:gestao@localhost:5432/gestao'

describe('loadEnv', () => {
  it('aplica os valores padrão', () => {
    expect(loadEnv({ DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DATABASE_URL,
      CORS_ORIGINS: '*',
      LIMITE_SUBMISSOES: 10,
    })
  })

  it('separa as origens do CORS por vírgula', () => {
    expect(
      loadEnv({ DATABASE_URL, CORS_ORIGINS: 'https://portal.exemplo.com, http://localhost:5173' })
        .CORS_ORIGINS,
    ).toEqual(['https://portal.exemplo.com', 'http://localhost:5173'])
  })

  it('converte PORT para número', () => {
    expect(loadEnv({ DATABASE_URL, PORT: '8080' }).PORT).toBe(8080)
  })

  it('aceita o esquema postgresql:// do Supabase', () => {
    const url = 'postgresql://postgres.abc:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
    expect(loadEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url)
  })

  it('exige DATABASE_URL de Postgres', () => {
    expect(() => loadEnv({})).toThrow('- DATABASE_URL:')
    expect(() => loadEnv({ DATABASE_URL: 'mysql://localhost/db' })).toThrow('- DATABASE_URL:')
  })

  it('lança erro listando as variáveis inválidas', () => {
    const carregar = () => loadEnv({ DATABASE_URL, PORT: 'abc', NODE_ENV: 'staging' })

    expect(carregar).toThrow('Variáveis de ambiente inválidas')
    expect(carregar).toThrow('- PORT:')
    expect(carregar).toThrow('- NODE_ENV:')
  })
})
