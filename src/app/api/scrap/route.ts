import ical from 'ical-generator'
import { JSDOM } from 'jsdom'

const getFitnessParkUrl = (data: {
  accountArea: number
  iframe: string
  articles: boolean
  date?: string
  offset?: number
  shops: number[]
}) => {
  // initial:
  // https://shop-fp-national.fitnesspark.ch/shop/courses/category/?&accountArea=1&iframe=yes&articles=true&offset=0&shops%5B%5D=576&_=1742629820299
  // https://shop-fp-national.fitnesspark.ch/shop/courses/category/?&accountArea=1&iframe=yes&articles=true&offset=0&shops%5B%5D=169&_=1742629820301

  // Mehr:
  // https://shop-fp-national.fitnesspark.ch/shop/courses/category/?articles=1&more=1&iframe=yes&date=2025-03-23&_=1742629820302
  // https://shop-fp-national.fitnesspark.ch/shop/courses/category/?articles=1&more=1&iframe=yes&date=2025-03-23&_=1742629820300
  // https://shop-fp-national.fitnesspark.ch/shop/courses/category/?articles=1&more=1&iframe=yes&date=2025-03-25&_=1742629820303

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
  // TODO "Bad"
  return match ? Number(match[1]) : 0
}

enum CourseStatus {
  AVAILABLE = 'available',
  FULL = 'full',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
  PENDING = 'pending',
}

type RoomNumber = number | 'pool'
type ReturnFormat = 'ical' | 'text' | 'html' | 'json'

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
    date: '2025-03-22',
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
  const events: {
    fullDate: Date
    timeStart: string
    duration: number
    name: string
    status: CourseStatus
    freeSlots: number
    location: string
    room: RoomNumber
    trainer: string
  }[] = []

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

  if (format === 'json') {
    return Response.json(events)
  }

  const calendar = ical({ name: 'Fitnesspark Events' })

  events.forEach((event) => {
    calendar.createEvent({
      start: event.fullDate,
      end: new Date(event.fullDate.getTime() + event.duration * 60000),
      summary: `${event.name} - ${event.trainer}`,
      description: `Room: ${event.room}, Status: ${event.status}, Free Slots: ${event.freeSlots}, Trainer: ${event.trainer}`,
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
