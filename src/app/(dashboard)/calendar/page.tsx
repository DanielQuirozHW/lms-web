import type { Metadata } from 'next'
import { CalendarView } from '@/components/features/calendar/CalendarView'

export const metadata: Metadata = { title: 'Calendario | NexusLMS' }

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Eventos, entregas y fechas importantes de tus cursos.
        </p>
      </div>
      <CalendarView />
    </div>
  )
}
