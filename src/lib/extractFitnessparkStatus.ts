import { CourseStatus } from '@/types'

export default function extractFitnessparkStatus(
  status: string,
): [CourseStatus, number?] {
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
