import Redis from 'ioredis'

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = parseInt(process.env.REDIS_PORT || '6379')
const redisPassword = process.env.REDIS_PASSWORD

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000)
  }
})

redis.on('error', (err) => {
  console.error('Redis Error:', err)
})

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  if (!data) return null
  return JSON.parse(data)
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function deleteCache(key: string) {
  await redis.del(key)
}

export async function clearPattern(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
