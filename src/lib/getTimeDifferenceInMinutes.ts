export default function getTimeDifferenceInMinutes(timeRange: string): number {
  const parts = timeRange.split(' - ')
  const start = parts[0] ?? ''
  const end = parts[1]

  if (!end) {
    // Default to 60 minutes if no end time provided
    return 60
  }

  const startParts = start.split(':').map(Number)
  const endParts = end.split(':').map(Number)

  const startHours = startParts[0] ?? 0
  const startMinutes = startParts[1] ?? 0
  const endHours = endParts[0] ?? 0
  const endMinutes = endParts[1] ?? 0

  const startDate = new Date()
  startDate.setHours(startHours, startMinutes, 0, 0)

  const endDate = new Date()
  endDate.setHours(endHours, endMinutes, 0, 0)

  const differenceInMilliseconds = endDate.getTime() - startDate.getTime()
  const differenceInMinutes = differenceInMilliseconds / (1000 * 60)

  return differenceInMinutes
}
