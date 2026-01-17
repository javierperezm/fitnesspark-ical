import { z } from 'zod'

const envSchema = z.object({
  REDIS_URL: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  BASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  )
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

// Constants
export const GOOGLE_CALENDAR_ADD_BY_URL =
  'https://calendar.google.com/calendar/r/settings/addbyurl'
