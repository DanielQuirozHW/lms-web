import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
      {/* CalendarView will go here */}
    </div>
  )
}
