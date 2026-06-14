import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CalendarEvent } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (startDate: string, endDate: string) =>
    [...calendarKeys.all, startDate, endDate] as const,
}

export function useCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: calendarKeys.events(startDate, endDate),
    queryFn: () =>
      api
        .get<PaginatedData<CalendarEvent>>('/calendar', { params: { startDate, endDate } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
