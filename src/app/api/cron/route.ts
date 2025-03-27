import { CRON_SECRET } from '@/config'
import { getShopsFromCache } from '@/lib/cachedShops'
import { saveEventsToCache } from '@/lib/eventsCache'
import { ScrapperWorker } from '@/lib/scrapper-worker'

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

  const shops = await getShopsFromCache()

  try {
    // the magic happens here: fetch data from the web and cache it
    const events = await new ScrapperWorker(shops).execute()

    // this is the data that /api/ical will use
    await saveEventsToCache(events)

    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)
    return Response.json({ ok: false })
  }
}
