import { redis } from '@/lib/redis'
import { FitnessparkEvent } from '@/types'

const getKey = (shops: number[]) => `fitnesspark-events-${shops.join('.')}`

export const saveEventsToCache = async (
  events: FitnessparkEvent[],
  shops: number[],
) => redis.set(getKey(shops), JSON.stringify(events))

export const getEventsFromCache = async (shops: number[]) =>
  (await redis.get<FitnessparkEvent[]>(getKey(shops))) ?? []
