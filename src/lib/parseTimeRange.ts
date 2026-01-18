/**
 * Splits a time range string into start and end times.
 * Supports both regular hyphen (U+002D) and EN DASH (U+2013).
 *
 * @example
 * splitTimeRange("10:00 – 11:00") // ["10:00", "11:00"]
 * splitTimeRange("10:00 - 11:00") // ["10:00", "11:00"]
 * splitTimeRange("10:00")         // ["10:00", undefined]
 */
export function splitTimeRange(
  timeRange: string,
): [string, string | undefined] {
  // Regex supports both regular hyphen (-) and EN DASH (–)
  const parts = timeRange.split(/\s[–-]\s/)
  return [parts[0]?.trim() ?? '', parts[1]?.trim()]
}
