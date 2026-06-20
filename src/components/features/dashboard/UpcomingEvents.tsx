'use client'

import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import type { CalendarEvent, CalendarEventType } from '@/types/models'

const chipStyle: Record<CalendarEventType, { bg: string }> = {
  ASSIGNMENT_DUE: { bg: 'linear-gradient(135deg, #f97316, #ea580c)' },
  QUIZ_DUE: { bg: 'linear-gradient(135deg, #8b7cff, #6d5bf0)' },
  LESSON_AVAILABLE: { bg: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
  COURSE_START: { bg: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  COURSE_END: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  CUSTOM: { bg: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
}

const typeLabel: Record<CalendarEventType, string> = {
  ASSIGNMENT_DUE: 'Entrega',
  QUIZ_DUE: 'Quiz',
  LESSON_AVAILABLE: 'Lección',
  COURSE_START: 'Inicio',
  COURSE_END: 'Fin de curso',
  CUSTOM: 'Evento',
}

const DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

function getChipLabels(dateStr: string, allDay: boolean): { day: string; time: string | null } {
  const date = new Date(dateStr)
  const now = new Date()
  const todayStr = now.toDateString()
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(now.getDate() + 1)

  let day: string
  if (date.toDateString() === todayStr) {
    day = 'HOY'
  } else if (date.toDateString() === tomorrowDate.toDateString()) {
    day = 'MAÑ'
  } else {
    day = DAYS[date.getDay()]
  }

  const time = allDay
    ? null
    : date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })

  return { day, time }
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
    <ul className="flex flex-col gap-2.5" aria-label="Próximos eventos">
      {events.map((event) => {
        const chip = chipStyle[event.type]
        const { day, time } = getChipLabels(event.startDate, event.allDay)

        return (
          <li key={event.id} className="flex items-center gap-3">
            {/* Colored date chip */}
            <div
              className="flex w-13 shrink-0 flex-col items-center justify-center rounded-[11px] py-2.25"
              style={{ background: chip.bg }}
              aria-label={`${day}${time ? ` ${time}` : ''}`}
            >
              <span className="text-[11px] leading-none font-bold text-white uppercase">{day}</span>
              {time && (
                <span className="mt-0.75 text-[12px] leading-none font-extrabold text-white">
                  {time}
                </span>
              )}
            </div>

            {/* Event info */}
            <div className="min-w-0 flex-1">
              <p className="text-nexus-text truncate text-[13.5px] leading-snug font-bold">
                {event.title}
              </p>
              <p className="text-nexus-muted mt-0.5 text-[12px]">{typeLabel[event.type]}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
