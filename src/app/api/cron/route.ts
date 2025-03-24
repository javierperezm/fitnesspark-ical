import { CRON_SECRET } from '@/config'
import { saveEventsToCache } from '@/lib/eventsCache'
import { getCachedEventsByDay } from '@/lib/getCachedEventsByDay'
import { FitnessparkEvent } from '@/types'

export const GET = async (req: Request) => {
  const urlParams = new URL(req.url).searchParams
  const hostname = new URL(req.url).hostname

  if (
    hostname !== 'localhost' &&
    req.headers.get('Authorization') !== `Bearer ${CRON_SECRET}` &&
    urlParams.get('secret') !== CRON_SECRET
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  const shops = urlParams.get('shops')?.split(',').map(Number) ?? [] // 169 = Zug

  // get 7 days of data
  const dates = []
  const today = new Date()
  today.setDate(today.getDate() - 1)
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }

  try {
    let events: FitnessparkEvent[] = []
    for (const date of dates) {
      for (const shop of shops) {
        const newEvents = await getCachedEventsByDay(shop, date)
        events = events.concat(newEvents)
      }
    }

    await saveEventsToCache(events, shops)
  } catch (error) {
    console.error(error)
    return Response.json({ ok: false })
  }

  return Response.json({ ok: true })
}
