export const AI_CONFIG = {
  model: 'gpt-4o',
  maxTokens: 1000,
  timeoutMs: 30_000,
  maxRetries: 3,
  retryDelayMs: 1_000,

  rateLimits: {
    perUserPerHour: 20,
    perSitePerHour: 200
  },

  prompts: {
    language: 'Indonesia',
    newsStyle: 'gaya penulisan berita Indonesia yang formal dan faktual'
  }
} as const

export type AIAction =
  | 'rewrite'
  | 'expand'
  | 'headline'
  | 'seo'
  | 'grammar'
  | 'readability'
  | 'layout'
  | 'caption'