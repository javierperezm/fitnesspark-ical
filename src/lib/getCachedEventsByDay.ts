import { format } from 'date-fns'

import delay from '@/lib/delay'
import extractEventsByDay from '@/lib/extractEventsByDay'
import { redis } from '@/lib/redis'
import { FitnessparkEvent } from '@/types'

const getKey = (shop: number, date: Date) =>
  `fitnesspark-shop-day-events-${shop}-${format(date, 'yyyy-MM-dd')}`

export const getCachedEventsByDay = async (
  shop: number,
  date: Date,
): Promise<FitnessparkEvent[]> => {
  const key = getKey(shop, date)

  const cachedEvents = await redis.get<FitnessparkEvent[]>(key)
  if (cachedEvents) return cachedEvents

  // EXTRACT
  const events = await extractEventsByDay(shop, date)

  await redis.set<FitnessparkEvent[]>(key, events)
  await redis.expire(key, calculateTTL(date))

  await delay(1)

  return events
}

const calculateTTL = (date: Date) => {
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)

  let ttl
  if (diffInHours < 24) {
    ttl = 60 * 5 // 5 minutes
  } else if (diffInHours >= 24 && diffInHours < 168) {
    ttl = Math.round(60 * (5 + (diffInHours - 24) * (55 / 144))) // Linear increment from 5 to 60 minutes
  } else {
    ttl = 60 * 60 // 60 minutes
  }

  console.log('TTL:', ttl)

  return ttl
}
