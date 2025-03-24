import { JSDOM } from 'jsdom'

import extractFitnessparkStatus from '@/lib/extractFitnessparkStatus'
import extractRoomNumber from '@/lib/extractRoomNumber'
import getFitnessParkUrl from '@/lib/getFitnessParkUrl'
import getTZDate from '@/lib/getTZDate'
import getTimeDifferenceInMinutes from '@/lib/getTimeDifferenceInMinutes'
import { FitnessparkEvent } from '@/types'

export default async function extractEventsByDay(
  shop: number,
  date: Date,
): Promise<FitnessparkEvent[]> {
  const url = getFitnessParkUrl({
    accountArea: 1,
    iframe: 'yes',
    articles: true,
    offset: 0,
    shops: [shop],
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
      const fullDate = getTZDate(currentDate, timeStart, 'Europe/Zurich')

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
        room: extractRoomNumber(cells[4].textContent!.trim()),
        trainer: cells[5].textContent!.trim(),
      }

      events.push(data)
    }
  })
  return events
}
