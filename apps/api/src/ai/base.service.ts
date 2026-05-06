import OpenAI from 'openai'
import { logger } from '../lib/logger'
import { env } from '../lib/env'

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 30_000,
})

export interface AIResult<T> {
  success: boolean
  data?: T
  error?: string
}

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
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const res = await client.chat.completions.create({
    model: env.AI_MODEL,
    max_tokens: opts.maxTokens ?? 1000,
    temperature: opts.temperature ?? 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })
  return res.choices[0]?.message?.content?.trim() ?? ''
}