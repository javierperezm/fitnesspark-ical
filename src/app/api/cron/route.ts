import { JSDOM } from 'jsdom'

import { saveEventsToCache } from '@/lib/eventsCache'
import { CourseStatus, FitnessparkEvent, RoomNumber } from '@/types'

const getFitnessParkUrl = (data: {
  accountArea: number
  iframe: string
  articles: boolean
  date?: string
  offset?: number
  shops: number[]
}) => {
  const url = new URL(
    'https://shop-fp-national.fitnesspark.ch/shop/courses/category/',
  )
  url.searchParams.append('accountArea', data.accountArea.toString()) // "1" or nothing
  url.searchParams.append('iframe', data.iframe) // "yes"
  url.searchParams.append('articles', data.articles.toString()) // "1" or "true"

  if (data.date) {
    url.searchParams.append('date', data.date)
  }

  if (data.offset !== undefined) {
    url.searchParams.append('offset', data.offset.toString())
  }

  data.shops.forEach((shop) => {
    url.searchParams.append('shops[]', shop.toString())
  })

  return url.toString()
}

const getTimeDifferenceInMinutes = (timeRange: string): number => {
  const [start, end] = timeRange.split(' - ')
  const [startHours, startMinutes] = start.split(':').map(Number)
  const [endHours, endMinutes] = end.split(':').map(Number)

  const startDate = new Date()
  startDate.setHours(startHours, startMinutes, 0, 0)

  const endDate = new Date()
  endDate.setHours(endHours, endMinutes, 0, 0)

  const differenceInMilliseconds = endDate.getTime() - startDate.getTime()
  const differenceInMinutes = differenceInMilliseconds / (1000 * 60)

  return differenceInMinutes
}

const fitnessparkStatus = (status: string): [CourseStatus, number?] => {
  const freeSlotsMatch = status.match(/(\d+)\s*Frei/)
  if (freeSlotsMatch) {
    return [CourseStatus.AVAILABLE, Number(freeSlotsMatch[1])]
  }

  return [
    {
      'nicht mehr verfÃ¼gbar': CourseStatus.CANCELLED,
      'nicht mehr verfügbar': CourseStatus.CANCELLED,
      ausgebucht: CourseStatus.FULL,
      Anstehend: CourseStatus.PENDING,
    }[status] ?? CourseStatus.UNKNOWN,
  ]
}

const extractRoomNumber = (room: string): RoomNumber => {
  if (room.match(/Bad/) && !room.match(/Kursraum/)) {
    return 'pool'
  }

  const match = room.match(/Kursraum\s+(\d+)/)
  return match ? Number(match[1]) : 0
}

const extractEvents = async (
  date: string,
  shops: number[],
): Promise<FitnessparkEvent[]> => {
  const url = getFitnessParkUrl({
    accountArea: 1,
    iframe: 'yes',
    articles: true,
    offset: 0,
    shops,
    date,
  })

  const response = await fetch(url)
  const data = await response.json()
  const htmlContent = data.articles as string

  const dom = new JSDOM(htmlContent)
  const document = dom.window.document
  const table = document.querySelector('table')

  if (!table) {
    return []
  }

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
      const fullDate = new Date(`${currentDate} ${timeStart}`)

      const data = {
        fullDate,
        timeStart,
        duration: getTimeDifferenceInMinutes(cells[0].textContent!),
        name: cells[1]
          .querySelectorAll('div.table-cell')[0]
          .textContent!.trim(),
        status: fitnessparkStatus(
          cells[1].querySelectorAll('div.table-cell')[1].textContent!.trim(),
        )[0],
        freeSlots:
          fitnessparkStatus(
            cells[1].querySelectorAll('div.table-cell')[1].textContent!.trim(),
          )[1] ?? 0,
        location: cells[3].textContent!.trim(),
        room: extractRoomNumber(cells[4].textContent!.trim()),
        trainer: cells[5].textContent!.trim(),
      }

      events.push(data)
    }
  })
  return events
}

export const GET = async (req: Request) => {
  const urlParams = new URL(req.url).searchParams
  const shops = urlParams.get('shops')?.split(',').map(Number) ?? [] // 169 = Zug

  const dates = []
  const today = new Date()
  today.setDate(today.getDate() - 1)
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
  }

  let events: FitnessparkEvent[] = []
  for (const date of dates) {
    const newEvents = await extractEvents(date, shops)
    events = events.concat(newEvents)
    delay(1)
  }

  await saveEventsToCache(events, shops)

  return new Response('OK')
}

const delay = (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
