export default function getTimeDifferenceInMinutes(timeRange: string): number {
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
