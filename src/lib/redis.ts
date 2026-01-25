import { Redis } from '@appaka/redis'

import { env } from '@/env'

export const redis = new Redis({
  url: env.REDIS_URL,
})
