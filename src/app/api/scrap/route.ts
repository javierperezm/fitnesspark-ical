import ical from 'ical-generator'
import { JSDOM } from 'jsdom'

import extractFitnessparkStatus from '@/lib/extractFitnessparkStatus'
import getFitnessParkUrl from '@/lib/getFitnessParkUrl'
import getTZDate from '@/lib/getTZDate'
import getTimeDifferenceInMinutes from '@/lib/getTimeDifferenceInMinutes'
import {
  CourseStatus,
  FitnessparkEvent,
  ReturnFormat,
  RoomNumber,
} from '@/types'

export const GET = async (req: Request) => {
  const urlParams = new URL(req.url).searchParams
  const format: ReturnFormat =
    (urlParams.get('format') as ReturnFormat) ?? 'ical'
  const shops = urlParams.get('shops')?.split(',').map(Number) ?? []

  // const url = 'https://shop-fp-national.fitnesspark.ch/shop/courses/category/?&accountArea=1&iframe=yes&articles=true&offset=0&shops%5B%5D=576&_=1742629820299'
  const url = getFitnessParkUrl({
    accountArea: 1,
    iframe: 'yes',
    articles: true,
    offset: 0,
    shops,
    date: new Date('2025-03-24'),
  })

  const response = await fetch(url)
  const data = await response.json()
  const htmlContent = data.articles as string

  if (format === 'html') {
    return new Response(htmlContent, {
      headers: { 'content-type': 'text/html' },
    })
  }

  const dom = new JSDOM(htmlContent)
  const document = dom.window.document
  const table = document.querySelector('table')

  if (!table) {
    return new Response('Table not found', { status: 404 })
  }

  // Aquí extraes los datos de la tabla
  const rows = table.querySelectorAll('tr')
  const events: FitnessparkEvent[] = []

  let currentDate = ''

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td')

    if (row.classList.contains('course-list__table__date-header')) {
      // date
      const dateString = cells[0].textContent!.trim()
      const [_, datePart] = dateString.split(', ')
      const [day, month, year] = datePart.split('.')
      currentDate = `${year}-${month}-${day}`
    } else if (row.classList.contains('course-list__table__course')) {
      // course

      const timeStart = cells[0].textContent?.split(' - ')[0]!
      // const fullDate = new Date(`${currentDate} ${timeStart}`)

      const timeZone = 'Europe/Zurich'
      // const timeZone = 'local'
      const fullDate = getTZDate(currentDate, timeStart, timeZone)

      const data = {
        fullDate,
        timeStart,
        duration: getTimeDifferenceInMinutes(cells[0].textContent!),
        name: cells[1]
          .querySelectorAll('div.table-cell')[0]
          .textContent!.trim(),
        status: extractFitnessparkStatus(
          cells[1].querySelectorAll('div.table-cell')[1].textContent!.trim(),
        )[0],
        freeSlots:
          extractFitnessparkStatus(
            cells[1].querySelectorAll('div.table-cell')[1].textContent!.trim(),
          )[1] ?? 0,
        location: cells[3].textContent!.trim(),
        room: extractFitnessparkStatus(cells[4].textContent!.trim())[1],
        trainer: cells[5].textContent!.trim(),
      }

      events.push(data)
    }
  })

  if (format === 'json') {
    return Response.json(events)
  }

  const calendar = ical({ name: 'Fitnesspark Events' })

  const statusEmoji = {
    [CourseStatus.AVAILABLE]: '✅',
    [CourseStatus.FULL]: '❌',
    [CourseStatus.CANCELLED]: '❌',
    [CourseStatus.UNKNOWN]: '❓',
    [CourseStatus.PENDING]: '⏳',
  }

  events.forEach((event) => {
    calendar.createEvent({
      start: event.fullDate,
      timezone: 'Europe/Zurich',
      end: new Date(event.fullDate.getTime() + event.duration * 60000),
      summary: `${statusEmoji[event.status]} ${event.name} → ${event.trainer}`,
      description: [
        `Room: ${event.room}`,
        `Status: ${event.status}`,
        `Free Slots: ${event.freeSlots}`,
        `Trainer: ${event.trainer}`,
      ].join('\n'),
      location: event.location,
    })
  })

  const icalString = calendar.toString()

  return new Response(icalString, {
    headers: {
      'Content-Type': format === 'text' ? 'text/plain' : 'text/calendar',
    },
  })
}
