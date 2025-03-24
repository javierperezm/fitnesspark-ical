import getFitnessParkUrl from '@/lib/getFitnessParkUrl'

export default async function fetchData(
  shop: number,
  date: Date,
): Promise<string> {
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

  return data.articles as string
}
