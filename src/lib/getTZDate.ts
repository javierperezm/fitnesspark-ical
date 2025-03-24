import { DateTime } from 'luxon'

export default function getTZDate(date: string, time: string, zone: string) {
  /*
  // Combina fecha y hora
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  // Crea el DateTime con zona horaria
  const dt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone, locale: 'de-CH' },
  )
    */

  const dt = DateTime.fromISO(`${date}T${time}`, { zone, locale: 'de-CH' })

  // Convierte a objeto Date (JS nativo)
  const d = dt.toJSDate()

  // console.log('getTZDate', { date, time, d, dt })

  return d
}
