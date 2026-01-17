import Redis from 'ioredis'

import { env } from '@/env'

let client: Redis | null = null

const getClient = (): Redis => {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      enableOfflineQueue: false,
    })
    client.on('error', (err) => console.error('Redis error:', err))
  }
  return client
}

// Wrapper that mimics Upstash API (auto JSON serialization)
// Gracefully handles connection failures by returning null/defaults
export const redis = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await getClient().get(key)
      if (val === null) return null
      try {
        return JSON.parse(val) as T
      } catch {
        return val as unknown as T
      }
    } catch (err) {
      console.error('Redis get error:', err)
      return null
    }
  },

  async set<T>(key: string, value: T): Promise<'OK' | null> {
    try {
      return await getClient().set(key, JSON.stringify(value))
    } catch (err) {
      console.error('Redis set error:', err)
      return null
    }
  },

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await getClient().expire(key, seconds)
    } catch (err) {
      console.error('Redis expire error:', err)
      return 0
    }
  },
}
