import { redis } from '@/lib/redis'
import { FitnessparkFetchDataFilter } from '@/types'

export const GET = async (req: Request) => {
  const locations = await redis.get<FitnessparkFetchDataFilter[]>('locations')
  const categories = await redis.get<FitnessparkFetchDataFilter[]>('categories')

  const removeMinutes = (str: string) => str.replace(/\s\d+'$/, '')

  const uniqueCategories = Array.from(
    new Set(categories?.map((category) => removeMinutes(category.name))),
  )

  return Response.json({ locations, categories })
}
