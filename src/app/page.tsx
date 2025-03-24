import { CalendarForm } from '@/components/calendar-form'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 ">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            FitnessPark Class Calendar
          </h1>
          <p className="text-muted-foreground">
            Select your preferred centers and class types to generate a calendar
            you can import into Google Calendar
          </p>
        </div>
        <CalendarForm />
      </div>
    </div>
  )
}
