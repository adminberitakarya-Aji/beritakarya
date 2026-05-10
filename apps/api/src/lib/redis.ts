import Redis from 'ioredis'
import { env } from './env'

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    // Stop retrying if not configured or after 3 attempts to avoid log spam
    if (!process.env.REDIS_HOST || times > 3) return null
    return Math.min(times * 50, 2000)
  }
})

redis.on('error', (err: Error) => {
  if (process.env.REDIS_HOST) {
    console.error('Redis Error:', err)
  }
})

export async function getCache<T>(key: string): Promise<T | null> {
  if (!process.env.REDIS_HOST) return null
  try {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (e) {
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600) {
  if (!process.env.REDIS_HOST) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (e) {}
}

export async function deleteCache(key: string) {
  if (!process.env.REDIS_HOST) return
  try {
    await redis.del(key)
  } catch (e) {}
}

export async function clearPattern(pattern: string) {
  if (!process.env.REDIS_HOST) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (e) {}
}
