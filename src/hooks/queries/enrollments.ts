import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { EnrollmentDetail } from '@/types/models'
import type { PaginatedData } from '@/types/api'

// Extends EnrollmentDetail with student info the API may embed in list responses
export interface EnrollmentWithStudent extends EnrollmentDetail {
  student?: {
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
  } | null
}

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  courseList: (courseId: string) => [...enrollmentKeys.all, 'course', courseId] as const,
  detail: (enrollmentId: string) => [...enrollmentKeys.all, 'detail', enrollmentId] as const,
  myList: () => [...enrollmentKeys.all, 'my'] as const,
}

export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: enrollmentKeys.courseList(courseId),
    queryFn: () =>
      api
        .get<PaginatedData<EnrollmentWithStudent>>(`/enrollments/course/${courseId}`)
        .then((r) => r.data),
    enabled: !!courseId,
    staleTime: 60 * 1000,
  })
}

export function useEnrollmentDetail(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.detail(enrollmentId),
    queryFn: () => api.get<EnrollmentDetail>(`/enrollments/${enrollmentId}`).then((r) => r.data),
    enabled: !!enrollmentId,
  })
}
