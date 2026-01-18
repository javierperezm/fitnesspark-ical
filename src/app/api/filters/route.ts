import { redis } from '@/lib/redis'
import { FitnessparkFetchDataFilter } from '@/types'

export const GET = async () => {
  const locations = await redis.get<FitnessparkFetchDataFilter[]>('locations')
  const categories = await redis.get<FitnessparkFetchDataFilter[]>('categories')

  // TODO: Consider deduplicating categories by removing duration suffix
  // e.g., "Yoga 55'" and "Yoga 70'" → "Yoga"
  // const removeMinutes = (str: string) => str.replace(/\s\d+'$/, '')
  // const uniqueCategories = [...new Set(categories?.map(c => removeMinutes(c.name)))]

  return Response.json({ locations, categories })
}
