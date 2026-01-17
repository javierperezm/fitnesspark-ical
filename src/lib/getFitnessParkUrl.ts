import { DateTime } from 'luxon'

export default function getFitnessParkUrl(data: {
  accountArea: number
  iframe: string
  articles: boolean
  date?: Date
  offset?: number
  shops: number[]
}) {
  const url = new URL(
    'https://shop-fp-national.fitnesspark.ch/shop/courses/category/',
  )
  url.searchParams.append('accountArea', data.accountArea.toString()) // "1" or nothing
  url.searchParams.append('iframe', data.iframe) // "yes"
  url.searchParams.append('articles', data.articles.toString()) // "1" or "true"

  if (data.date) {
    const day = DateTime.fromJSDate(data.date).toFormat('yyyy-MM-dd')
    url.searchParams.append('date', day)
  }

  if (data.offset !== undefined) {
    url.searchParams.append('offset', data.offset.toString())
  }

  data.shops.forEach((shop) => {
    url.searchParams.append('shops[]', shop.toString())
  })

  return url.toString()
}
