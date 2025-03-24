import crypto from 'crypto'
import ical from 'ical-generator'
import { DateTime } from 'luxon'

import { CourseStatus, FitnessparkEvent } from '@/types'

const statusEmoji = {
  [CourseStatus.AVAILABLE]: '✅',
  [CourseStatus.FULL]: '❌',
  [CourseStatus.CANCELLED]: '❌',
  [CourseStatus.UNKNOWN]: '❓',
  [CourseStatus.PENDING]: '⏳',
}

export default function generateCalendarContent(
  name: string,
  events: FitnessparkEvent[],
): string {
  const calendar = ical({ name, timezone: 'Europe/Zurich' })

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

    const dateStart = DateTime.fromJSDate(fullDate).setZone('Europe/Zurich')
    const dateEnd = dateStart.plus({ minutes: event.duration })

    calendar.createEvent({
      start: dateStart,
      timezone: 'Europe/Zurich',
      end: dateEnd,
      summary: `${statusEmoji[event.status]} ${event.name} → ${event.trainer}`,
      description: [
        `Status: ${event.status}`,
        `Free Slots: ${event.freeSlots}`,
        `Trainer: ${event.trainer}`,
        `Room: ${event.room}`,
        ``,
        `by Javier Pérez: https://javierperez.com/`,
      ].join('\n'),
      location: event.location,
      id: eventId,
    })
  })

  return calendar.toString()
}
