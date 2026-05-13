import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4-turbo-preview'),
  API_URL: z.string().default('http://localhost:3001'),
  CORS_ORIGIN: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  MEILISEARCH_HOST: z.string().default('http://localhost:7700'),
  MEILISEARCH_KEY: z.string().default(''),
  SENTRY_DSN: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
