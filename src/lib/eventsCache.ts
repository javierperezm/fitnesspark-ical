import { redis } from '@/lib/redis'
import { FitnessparkEvent } from '@/types'

const getKey = (shops: number[]) => `fitnesspark-events-${shops.join('.')}`

export const saveEventsToCache = async (
  events: FitnessparkEvent[],
  shops: number[],
) => redis.set<FitnessparkEvent[]>(getKey(shops), events)

export const getEventsFromCache = async (shops: number[]) =>
  (await redis.get<FitnessparkEvent[]>(getKey(shops))) ?? []
