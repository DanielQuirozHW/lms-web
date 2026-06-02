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

export function useBulkEnroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userIds, courseId }: { userIds: string[]; courseId: string }) =>
      api.post('/enrollments/bulk', { userIds, courseId }).then((r) => r.data),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.courseList(courseId) })
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
    },
  })
}

export function useRemoveUserEnrollment(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => api.delete(`/users/${userId}/enrollments/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.userList(userId) })
    },
  })
}
