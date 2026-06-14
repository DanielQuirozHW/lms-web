import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CalendarEvent } from '@/types/models'
import { calendarKeys } from '@/hooks/queries/calendar'

interface CreateCalendarEventInput {
  title: string
  type: 'CUSTOM'
  startDate: string
  allDay: boolean
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCalendarEventInput) =>
      api.post<CalendarEvent>('/calendar', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}
