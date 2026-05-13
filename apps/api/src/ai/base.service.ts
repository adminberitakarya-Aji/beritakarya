import OpenAI from 'openai'
import { logger } from '../lib/logger'
import { env } from '../lib/env'
import { getCache, setCache } from '../lib/redis'
import { createHash } from 'crypto'
import CircuitBreaker from 'opossum'

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 30_000,
})

export interface AIResult<T> {
  success: boolean
  data?: T
  error?: string
  fallback?: boolean
  cached?: boolean
}

// Generate cache key from prompt + options
function getCacheKey(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): string {
  const hash = createHash('md5')
  const content = `${systemPrompt}|${userPrompt}|${opts.model || env.AI_MODEL}|${opts.maxTokens || 1000}|${opts.temperature || 0.7}`
  hash.update(content)
  return `ai:${hash.digest('hex')}`
}

// Circuit breaker for OpenAI with fallback
const openaiBreaker = new CircuitBreaker(
  async (systemPrompt: string, userPrompt: string, opts: { 
    maxTokens?: number; 
    temperature?: number; 
    model?: string;
  }) => {
    const res = await client.chat.completions.create({
      model: opts.model || env.AI_MODEL,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
    return res.choices[0]?.message?.content?.trim() ?? ''
  },
  {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  }
)

export async function callAI<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<AIResult<T>> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (err: any) {
      lastError = err
      const isRetryable =
        err?.status === 429 ||
        err?.status >= 500 ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET'

      if (!isRetryable || attempt === maxRetries) break

      const delay = Math.pow(2, attempt - 1) * 1000
      logger.warn(`AI retry attempt ${attempt}/${maxRetries} in ${delay}ms — ${err.message}`)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  logger.error({ message: 'AI call failed', error: lastError?.message })
  return {
    success: false,
    error: 'AI tidak tersedia saat ini. Coba lagi nanti.'
  }
}

export async function chatComplete(
  systemPrompt: string,
  userPrompt: string,
  opts: { 
    maxTokens?: number; 
    temperature?: number; 
    model?: string;
    useCache?: boolean;
    cacheTtl?: number;
  } = {}
): Promise<string> {
  const {
    model = env.AI_MODEL,
    useCache = true,
    cacheTtl = 3600
  } = opts

  // Check cache first (if enabled)
  if (useCache && process.env.REDIS_HOST) {
    const cacheKey = getCacheKey(systemPrompt, userPrompt, { ...opts, model })
    const cached = await getCache<{ result: string }>(cacheKey)
    if (cached?.result) {
      logger.debug('Cache hit for AI request')
      return cached.result
    }
  }

  // Use circuit breaker for OpenAI call
  let result: string
  try {
    result = await openaiBreaker.fire(systemPrompt, userPrompt, {
      maxTokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
      model
    })
  } catch (err: any) {
    logger.error('OpenAI circuit breaker error:', err.message)
    
    // Circuit is open, return fallback message
    // opossum circuit breaker throws Error when circuit is open
    if (openaiBreaker.state === 'open') {
      return '[Service temporarily unavailable]'
    }
    
    throw err
  }

  // Cache successful result
  if (useCache && process.env.REDIS_HOST && result) {
    const cacheKey = getCacheKey(systemPrompt, userPrompt, { ...opts, model })
    await setCache(cacheKey, { result }, cacheTtl)
    logger.debug('Cached AI response')
  }

  return result
}