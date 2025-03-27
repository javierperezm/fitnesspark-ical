import { redis } from '@/lib/redis'
import { FitnessparkEvent } from '@/types'

const getKey = () => `fitnesspark-events`

export const saveEventsToCache = async (events: FitnessparkEvent[]) =>
  redis.set<FitnessparkEvent[]>(getKey(), events)

export const getEventsFromCache = async (shops: number[]) =>
  ((await redis.get<FitnessparkEvent[]>(getKey())) ?? []).filter((event) =>
    shops.includes(event.shop),
  )
