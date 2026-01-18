# Fitnesspark iCal

A Next.js application that scrapes Fitnesspark course schedules and generates iCal feeds for calendar subscriptions.

## Overview

This app fetches course data from Fitnesspark's website, parses the HTML, and serves it as iCal feeds that users can subscribe to in their calendar apps (Google Calendar, Apple Calendar, etc.).

## Architecture

```
User Request → /api/ical → ScrapperWorker → extractEventsByDay → fetchData
                                ↓                    ↓
                            Redis Cache      HTML Validation
                                ↓                    ↓
                        generateCalendarContent  Email Alerts (if errors)
```

### Data Flow

1. **Cron Job** (`/api/cron`): Scheduled task that pre-fetches data for all shops
2. **iCal Endpoint** (`/api/ical`): Returns iCal feed filtered by shop/category
3. **Scrapper Worker**: Manages scraping queue with rate limiting and caching
4. **HTML Validator**: Validates Fitnesspark HTML structure, sends alerts on changes

## Key Files

| File | Description |
|------|-------------|
| `src/lib/scrapper-worker.ts` | Main scraping orchestrator with caching |
| `src/lib/extractEventsByDay.ts` | HTML parsing and event extraction |
| `src/lib/htmlValidator.ts` | Validates HTML structure for changes |
| `src/lib/parseTimeRange.ts` | Parses time ranges (handles EN DASH) |
| `src/lib/generateCalendarContent.ts` | Generates iCal format |
| `src/lib/emailAlerts.ts` | Sends alerts via Resend |
| `src/types.ts` | TypeScript definitions |
| `src/env.ts` | Environment variable validation |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_REST_API_URL` | Yes | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Yes | Upstash Redis token |
| `CRON_SECRET` | Yes | Secret for cron endpoint auth |
| `BASE_URL` | Yes | Application base URL |
| `RESEND_API_KEY` | No | Resend API key for email alerts |
| `ALERT_EMAIL_TO` | No | Email recipient for alerts |
| `ALERT_EMAIL_FROM` | No | Email sender (default: alerts@fitnesspark-ical.app) |

## Common Issues & Solutions

### EN DASH Bug (Critical)

**Problem**: Fitnesspark uses EN DASH (U+2013 `–`) in time ranges like "10:00 – 11:00", but code previously used regular hyphen (U+002D `-`).

**Symptom**: `fullDate: null` resulting in epoch dates (1970-01-01).

**Solution**: Use `splitTimeRange()` from `src/lib/parseTimeRange.ts` which handles both characters:
```typescript
const parts = timeRange.split(/\s[–-]\s/)  // Supports both
```

### HTML Structure Changes

When Fitnesspark changes their HTML structure, the scraper may fail silently or produce incorrect data.

**Solution**: The `htmlValidator.ts` validates:
- Table existence
- Filter selects (`select.course-list__filter`)
- Date headers (`.course-list__table__date-header`)
- Course rows (`.course-list__table__course`)
- Date format: `Weekday, DD.MM.YYYY`
- Time format: `HH:MM – HH:MM` or `HH:MM - HH:MM`

Email alerts are sent via Resend when validation fails.

### Cache Issues

Data is cached in Redis with TTL based on event proximity:
- Events < 24h away: 1 hour TTL
- Events further away: Linearly scaled up to 24 hour TTL

To force refresh, the cron job refetches all data.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Type check
pnpm typecheck
```

## API Endpoints

### GET /api/ical

Returns iCal feed of courses.

**Query Parameters:**
- `shops` (required): Comma-separated shop IDs (e.g., `169`)
- `categories` (optional): Comma-separated category IDs
- `format` (optional): `ical` (default), `json`, `text`, `html`

**Example:**
```
/api/ical?shops=169&format=ical
/api/ical?shops=169&format=json
```

### GET /api/cron

Triggers data refresh. Requires `secret` query parameter matching `CRON_SECRET`.

```
/api/cron?secret=YOUR_CRON_SECRET
```

### GET /api/filters

Returns available locations and categories.

### GET /api/scrap

Manual scraping trigger (development).

## Shop IDs

| Shop | ID |
|------|-----|
| Zug | 169 |

(Add more shop IDs as discovered)

## Validation Error Codes

| Code | Description |
|------|-------------|
| `TABLE_MISSING` | Main course table not found |
| `FILTER_SELECT_MISSING` | Filter dropdowns missing |
| `DATE_HEADER_ROW_MISSING` | No date header rows |
| `COURSE_ROW_STRUCTURE_INVALID` | Course row structure changed |
| `DATE_FORMAT_CHANGED` | Date format doesn't match expected |
| `TIME_FORMAT_CHANGED` | Time format doesn't match expected |
| `CELL_COUNT_MISMATCH` | Course row has unexpected cell count |
