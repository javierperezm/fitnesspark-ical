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
export const redis = {
  async get<T>(key: string): Promise<T | null> {
    const val = await getClient().get(key)
    if (val === null) return null
    try {
      return JSON.parse(val) as T
    } catch {
      return val as unknown as T
    }
  },

  async set<T>(key: string, value: T): Promise<'OK'> {
    return getClient().set(key, JSON.stringify(value))
  },

  async expire(key: string, seconds: number): Promise<number> {
    return getClient().expire(key, seconds)
  },
}
