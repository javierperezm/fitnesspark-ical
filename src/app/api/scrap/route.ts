import extractEventsByDay from '@/lib/extractEventsByDay'
import fetchData from '@/lib/fetchData'
import generateCalendarContent from '@/lib/generateCalendarContent'
import { ReturnFormat } from '@/types'

export const GET = async (req: Request) => {
  const urlParams = new URL(req.url).searchParams
  const format: ReturnFormat =
    (urlParams.get('format') as ReturnFormat) ?? 'ical'
  const shopsParam = urlParams.get('shops') ?? urlParams.get('shop')
  const shops = shopsParam?.split(',').map(Number).filter(Boolean) ?? []

  if (shops.length === 0) {
    return Response.json(
      { error: 'Missing required parameter: shops or shop' },
      { status: 400 },
    )
  }

  const date = new Date('2026-01-20')

  if (format === 'html') {
    const html = await fetchData(shops[0], date)
    return new Response(html, {
      headers: { 'content-type': 'text/html' },
    })
  }

  const { events, locations, categories } = await extractEventsByDay(
    shops[0],
    date,
  )

  if (format === 'json') {
    return Response.json({ locations, categories, events })
  }

  const icalString = generateCalendarContent('Fitnesspark', events)

  return new Response(icalString, {
    headers: {
      'Content-Type': format === 'text' ? 'text/plain' : 'text/calendar',
    },
  })
}
