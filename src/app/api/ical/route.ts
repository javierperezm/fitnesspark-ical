import crypto from 'crypto'
import ical from 'ical-generator'

import { getEventsFromCache } from '@/lib/eventsCache'

type ReturnFormat = 'ical' | 'text' | 'html' | 'json'

export const GET = async (req: Request) => {
  const urlParams = new URL(req.url).searchParams
  const format: ReturnFormat =
    (urlParams.get('format') as ReturnFormat) ?? 'ical'
  const shops = urlParams.get('shops')?.split(',').map(Number) ?? [] // 169 = Zug

  const events = await getEventsFromCache(shops)

  if (format === 'json') {
    return Response.json(events)
  }

  const calendar = ical({ name: 'Fitnesspark Events' })
  calendar.timezone('Europe/Zurich')

  events.forEach((event) => {
    const fullDate = new Date(event.fullDate)

    const idBuilder = [
      fullDate.getTime().toString(),
      event.name,
      event.trainer,
      event.location,
    ]

    const hash = crypto.createHash('sha1')
    hash.update(idBuilder.join(''))
    const eventId = hash.digest('hex')

    calendar.createEvent({
      start: fullDate,
      timezone: 'Europe/Zurich',
      end: new Date(fullDate.getTime() + event.duration * 60000),
      summary: `${event.name} - ${event.trainer}`,
      description: `Room: ${event.room}, Status: ${event.status}, Free Slots: ${event.freeSlots}, Trainer: ${event.trainer}`,
      location: event.location,
      id: eventId,
    })
  })

  const icalString = calendar.toString()

  return new Response(icalString, {
    headers: {
      'Content-Type': format === 'text' ? 'text/plain' : 'text/calendar',
    },
  })
}
