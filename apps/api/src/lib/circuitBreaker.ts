import CircuitBreaker from 'opossum'

// OpenAI Circuit Breaker
export const openaiBreaker = new CircuitBreaker(
  async (prompt: string, options?: { model?: string; temperature?: number }) => {
    // This will be implemented where OpenAI is called
    // The actual OpenAI call should import and use this breaker
    throw new Error('OpenAI circuit breaker: not yet wired to actual service')
  },
  {
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 50, // Trip after 50% failure rate
    resetTimeout: 30000 // Try to recover after 30 seconds
  }
)

// Meilisearch Circuit Breaker
export const meilisearchBreaker = new CircuitBreaker(
  async (query: string, index?: string, options?: any) => {
    // This will be implemented where Meilisearch is called
    throw new Error('Meilisearch circuit breaker: not yet wired to actual service')
  },
  {
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 50, // Trip after 50% failure rate
    resetTimeout: 30000 // Try to recover after 30 seconds
  }
)

// Fallback functions for when circuit is open
export const openaiFallback = async (prompt: string) => {
  return {
    success: false,
    message: 'AI service temporarily unavailable. Please try again later.',
    fallback: true
  }
}

export const meilisearchFallback = async (query: string) => {
  return {
    success: false,
    message: 'Search service temporarily unavailable. Please try again later.',
    fallback: true,
    results: []
  }
}