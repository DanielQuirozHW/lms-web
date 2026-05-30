import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Enrollment } from '@/types/models'
import { courseKeys } from '@/hooks/queries/courses'
import { enrollmentKeys } from '@/hooks/queries/enrollments'

export function useEnrollMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) =>
      api.post<Enrollment>('/enrollments', { courseId }).then((r) => r.data),
    onSuccess: (_enrollment, courseId) => {
      // Bust the course list so enrolled state is reflected everywhere
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
      // Bust the instructor's enrollment list for this course
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.courseList(courseId) })
    },
  })
}
