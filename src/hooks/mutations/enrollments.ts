import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Enrollment } from '@/types/models'
import { courseKeys } from '@/hooks/queries/courses'
import { enrollmentKeys } from '@/hooks/queries/enrollments'

export function useEnrollMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, code }: { courseId: string; code?: string }) =>
      api
        .post<Enrollment>('/enrollments', { courseId, ...(code ? { code } : {}) })
        .then((r) => r.data),
    onSuccess: (_enrollment, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.courseList(courseId) })
    },
  })
}
