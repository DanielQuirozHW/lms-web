import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { enrollmentKeys } from '@/hooks/queries/enrollments'

interface ProgressUpdate {
  watchedSeconds?: number
  completed?: boolean
}

export function useUpdateProgress(courseId: string, moduleId: string, lessonId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProgressUpdate) =>
      api.patch(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/progress`, data),
    onSuccess: () => {
      // Refresh enrollment progress so sidebar percentage and course status update
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}
