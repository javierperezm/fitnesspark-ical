import { JSDOM } from 'jsdom'

import extractFitnessparkStatus from '@/lib/extractFitnessparkStatus'
import extractRoomNumber from '@/lib/extractRoomNumber'
import fetchData from '@/lib/fetchData'
import getTZDate from '@/lib/getTZDate'
import getTimeDifferenceInMinutes from '@/lib/getTimeDifferenceInMinutes'
import { FitnessparkEvent, FitnessparkFetchDataFilter } from '@/types'

// scrapper
export default async function extractEventsByDay(
  shop: number,
  date: Date,
): Promise<{
  locations: FitnessparkFetchDataFilter[]
  categories: FitnessparkFetchDataFilter[]
  events: FitnessparkEvent[]
}> {
  const htmlContent = await fetchData(shop, date)

  const dom = new JSDOM(htmlContent)
  const document = dom.window.document

  // fetch fitnesspark locations
  const selects = document.querySelectorAll('select.course-list__filter')
  const selectLocations = selects[0]
  const selectCategories = selects[1]

  const locations = selectLocations
    ? Array.from(selectLocations.querySelectorAll('option')).map((option) => ({
        id: Number(option.getAttribute('data-location') ?? 0),
        name: option.textContent?.trim() ?? '',
      }))
    : []

  const categories = selectCategories
    ? Array.from(selectCategories.querySelectorAll('option')).map((option) => {
        const tid = option.getAttribute('data-tid')?.trim() ?? ''
        const m = tid.match(/\[(\d+)\]/)
        const id = m ? Number(m[1]) : 0
        return {
          id,
          name: option.textContent?.trim() ?? '',
        }
      })
    : []

  // console.log('extractEventsByDay', { locations, categories })

  const table = document.querySelector('table')

  if (!table) {
    return { locations, categories, events: [] }
  }

  const rows = table.querySelectorAll('tr')
  const events: FitnessparkEvent[] = []

  let currentDate = ''

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td')

    if (row.classList.contains('course-list__table__date-header')) {
      // date
      const dateString = cells[0].textContent?.trim() ?? ''
      const parts = dateString.split(', ')
      if (parts.length < 2) {
        console.warn('Unexpected date format:', dateString)
        return // Skip this row
      }
      const datePart = parts[1]
      const dateParts = datePart.split('.')
      if (dateParts.length < 3) {
        console.warn('Unexpected date part format:', datePart)
        return
      }
      const [day, month, year] = dateParts
      currentDate = `${year}-${month}-${day}`
    } else if (row.classList.contains('course-list__table__course')) {
      // course
      const timeCell = cells[0]?.textContent ?? ''
      const timeStart = timeCell.split(' - ')[0] ?? ''

      if (!timeStart || !currentDate) {
        console.warn('Missing time or date for course row')
        return
      }

      const fullDate = getTZDate(currentDate, timeStart, 'Europe/Zurich')
      const tableCells = cells[1]?.querySelectorAll('div.table-cell') ?? []
      const statusText = tableCells[1]?.textContent?.trim() ?? ''

      const data = {
        shop,
        fullDate,
        timeStart,
        duration: getTimeDifferenceInMinutes(timeCell),
        name: tableCells[0]?.textContent?.trim() ?? '',
        status: extractFitnessparkStatus(statusText)[0],
        freeSlots: extractFitnessparkStatus(statusText)[1] ?? 0,
        location: cells[3]?.textContent?.trim() ?? '',
        room: extractRoomNumber(cells[4]?.textContent?.trim() ?? ''),
        trainer: cells[5]?.textContent?.trim() ?? '',
      }

      events.push(data)
    }
  })
  return { locations, categories, events }
}
