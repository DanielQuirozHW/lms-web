import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Enrollment } from '@/types/models'
import { courseKeys } from '@/hooks/queries/courses'

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  list: (filters?: Record<string, unknown>) => [...enrollmentKeys.all, 'list', filters] as const,
}

export function useEnrollMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) =>
      api.post<Enrollment>('/enrollments', { courseId }).then((r) => r.data),
    onSuccess: (_enrollment, courseId) => {
      // Bust the course list so enrolled state is reflected everywhere
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.list({ courseId }) })
    },
  })
}
