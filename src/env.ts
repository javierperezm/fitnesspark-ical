import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    REDIS_URL: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    BASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    UMAMI_WEBSITE_ID: z.string().optional(),
  },
  client: {
    // No client variables needed
  },
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    BASE_URL: process.env.BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    UMAMI_WEBSITE_ID: process.env.UMAMI_WEBSITE_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

// Constants (these CAN be used in client)
export const GOOGLE_CALENDAR_ADD_BY_URL =
  "https://calendar.google.com/calendar/r/settings/addbyurl";
