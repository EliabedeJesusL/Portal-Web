import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Opcional: sobe o limite da API do GitHub de 60 para 5000 requisições por hora.
  GITHUB_TOKEN: z.string().min(1).optional(),
  // Origens liberadas no CORS, separadas por vírgula. Sem valor, qualquer origem:
  // a API não usa cookies, só tokens no cabeçalho Authorization.
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor.split(',').map((o) => o.trim()).filter(Boolean) : '*')),
  // Submissões de jogo por IP a cada 10 minutos (a rota é pública).
  LIMITE_SUBMISSOES: z.coerce.number().int().positive().default(10),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    const problemas = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`Variáveis de ambiente inválidas:\n${problemas}`)
  }

  return result.data
}
