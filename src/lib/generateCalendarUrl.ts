export default function generateCalendarUrl(
  locations: number[],
  categories: number[],
  baseUrl: string,
): string {
  const pieces = [
    `shops=${locations.join(',')}`,
    categories.length > 0 ? `categories=${categories.join(',')}` : undefined,
    `v=${Date.now()}`,
  ].join('&')

  return `${baseUrl}/api/ical?${pieces}`
}
