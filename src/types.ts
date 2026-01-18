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
  shop: number
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

export type FitnessparkFetchDataFilter = {
  id: number
  name: string
}

// HTML Validation Types
export interface HtmlValidationResult {
  timestamp: Date
  shop: number
  isValid: boolean
  errors: HtmlValidationError[]
  rawHtmlSample?: string
}

export interface HtmlValidationError {
  code: ValidationErrorCode
  message: string
  selector?: string
  expected?: string
  actual?: string
}

export enum ValidationErrorCode {
  TABLE_MISSING = 'TABLE_MISSING',
  FILTER_SELECT_MISSING = 'FILTER_SELECT_MISSING',
  DATE_HEADER_ROW_MISSING = 'DATE_HEADER_ROW_MISSING',
  COURSE_ROW_STRUCTURE_INVALID = 'COURSE_ROW_STRUCTURE_INVALID',
  DATE_FORMAT_CHANGED = 'DATE_FORMAT_CHANGED',
  TIME_FORMAT_CHANGED = 'TIME_FORMAT_CHANGED',
  CELL_COUNT_MISMATCH = 'CELL_COUNT_MISMATCH',
}
