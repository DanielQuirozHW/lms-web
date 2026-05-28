'use client'

import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CalendarEvent, CalendarEventType } from '@/types/models'

const dotColor: Record<CalendarEventType, string> = {
  ASSIGNMENT_DUE: 'bg-amber-500',
  QUIZ_DUE: 'bg-purple-500',
  LESSON_AVAILABLE: 'bg-nexus-accent',
  COURSE_START: 'bg-nexus-success',
  COURSE_END: 'bg-destructive',
  CUSTOM: 'bg-nexus-muted',
}

const typeLabel: Record<CalendarEventType, string> = {
  ASSIGNMENT_DUE: 'Entrega',
  QUIZ_DUE: 'Quiz',
  LESSON_AVAILABLE: 'Lección',
  COURSE_START: 'Inicio de curso',
  COURSE_END: 'Fin de curso',
  CUSTOM: 'Evento',
}

interface UpcomingEventsProps {
  events: CalendarEvent[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sin eventos próximos"
        description="No tenés eventos para los próximos 7 días"
        className="border-nexus-border min-h-50"
      />
    )
  }

  return (
    <ul className="space-y-2" aria-label="Próximos eventos">
      {events.map((event) => (
        <li
          key={event.id}
          className="border-nexus-border bg-nexus-card flex items-start gap-3 rounded-lg border p-3"
        >
          <span
            className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', dotColor[event.type])}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-nexus-text truncate text-sm font-medium">{event.title}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-nexus-muted text-xs">{typeLabel[event.type]}</span>
              <span className="text-nexus-muted text-xs" aria-hidden="true">
                ·
              </span>
              <time dateTime={event.startDate} className="text-nexus-muted text-xs">
                {formatRelativeTime(event.startDate)}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
