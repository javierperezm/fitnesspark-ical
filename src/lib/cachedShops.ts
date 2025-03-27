import { redis } from '@/lib/redis'

const KEY = 'shops'

export const saveShopsToCache = async (shops: number[]) =>
  await redis.set<number[]>(KEY, shops)

export const getShopsFromCache = async () =>
  (await redis.get<number[]>(KEY)) ?? [169] // Zug
