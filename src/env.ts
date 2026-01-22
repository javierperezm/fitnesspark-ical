import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    KV_REST_API_URL: z.string().url(),
    KV_REST_API_TOKEN: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    BASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    UMAMI_WEBSITE_ID: z.string().optional(),
    UMAMI_WEBSITE_URL: z.string().url().optional(),
    // Email alerts (Resend)
    RESEND_API_KEY: z.string().min(1).optional(),
    ALERT_EMAIL_TO: z.string().min(1).optional(),
    ALERT_EMAIL_FROM: z.string().min(1).default("alerts@fitnesspark-ical.app"),
  },
  client: {
    // No client variables needed
  },
  runtimeEnv: {
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    BASE_URL: process.env.BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    UMAMI_WEBSITE_ID: process.env.UMAMI_WEBSITE_ID,
    UMAMI_WEBSITE_URL: process.env.UMAMI_WEBSITE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO,
    ALERT_EMAIL_FROM: process.env.ALERT_EMAIL_FROM,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

// Constants (these CAN be used in client)
export const GOOGLE_CALENDAR_ADD_BY_URL =
  "https://calendar.google.com/calendar/r/settings/addbyurl";
