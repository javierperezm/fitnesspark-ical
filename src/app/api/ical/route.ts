import { getEventsFromCache } from '@/lib/eventsCache'
import generateCalendarContent from '@/lib/generateCalendarContent'
import { redis } from '@/lib/redis'
import { FitnessparkEvent, FitnessparkFetchDataFilter } from '@/types'

type ReturnFormat = 'ical' | 'text' | 'html' | 'json'

const filterEvents = async (events: FitnessparkEvent[], filters: number[]) => {
  const categoriesList =
    (await redis.get<FitnessparkFetchDataFilter[]>('categories')) ?? []

  const filterStrings = categoriesList
    .filter((c) => filters.includes(c.id))
    .map((c) => c.name)

  return events.filter((event) =>
    filterStrings.some((filter) => event.name.includes(filter)),
  )
}

export const GET = async (req: Request) => {
  // get query params
  const urlParams = new URL(req.url).searchParams
  const format: ReturnFormat =
    (urlParams.get('format') as ReturnFormat) ?? 'ical'
  const shops = urlParams.get('shops')?.split(',').map(Number) ?? [] // 169 = Zug
  const filters = urlParams.get('categories')?.split(',').map(Number) ?? []

  // fetch events
  const events = await getEventsFromCache(shops)

  // get data filters from redis
  const locationsList =
    (await redis.get<FitnessparkFetchDataFilter[]>('locations')) ?? []

  const filteredEvents =
    filters.length > 0 ? await filterEvents(events, filters) : events

  if (format === 'json') {
    return Response.json(filteredEvents)
  }

  const calendarName =
    shops.length === 1
      ? (locationsList.find((l) => l.id === shops[0])?.name ?? 'Fitnesspark')
      : 'Fitnesspark'

  const icalString = generateCalendarContent(
    `${calendarName} Events`,
    filteredEvents,
  )

  return new Response(icalString, {
    headers: {
      'Content-Type': format === 'text' ? 'text/plain' : 'text/calendar',
    },
  })
}
