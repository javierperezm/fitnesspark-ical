export enum CourseStatus {
  AVAILABLE = 'available',
  FULL = 'full',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
  PENDING = 'pending',
}

export type RoomNumber = number | 'pool'

export type ReturnFormat = 'ical' | 'text' | 'html' | 'json'

export type FitnessparkEvent = {
  fullDate: Date
  timeStart: string
  duration: number
  name: string
  status: CourseStatus
  freeSlots: number
  location: string
  room?: RoomNumber
  trainer: string
}
