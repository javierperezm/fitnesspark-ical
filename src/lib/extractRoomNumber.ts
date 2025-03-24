import { RoomNumber } from '@/types'

export default function extractRoomNumber(room: string): RoomNumber {
  if (room.match(/Bad/) && !room.match(/Kursraum/)) {
    return 'pool'
  }

  const match = room.match(/Kursraum\s+(\d+)/)
  return match ? Number(match[1]) : 0
}
