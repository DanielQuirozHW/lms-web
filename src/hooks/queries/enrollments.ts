import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { EnrollmentDetail, CourseStatus, UserEnrollmentItem } from '@/types/models'
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

// Extends EnrollmentDetail with course info the API embeds in user-enrollment responses
export interface EnrollmentWithCourse extends EnrollmentDetail {
  course?: {
    id: string
    title: string
    coverUrl: string | null
    status: CourseStatus
  } | null
}

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  courseList: (courseId: string) => [...enrollmentKeys.all, 'course', courseId] as const,
  userList: (userId: string) => [...enrollmentKeys.all, 'user', userId] as const,
  detail: (enrollmentId: string) => [...enrollmentKeys.all, 'detail', enrollmentId] as const,
  myList: () => [...enrollmentKeys.all, 'my'] as const,
  myActive: (userId: string | undefined) => [...enrollmentKeys.all, 'my-active', userId] as const,
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

export function useUserEnrollments(userId: string) {
  return useQuery({
    queryKey: enrollmentKeys.userList(userId),
    queryFn: () =>
      api
        .get<PaginatedData<EnrollmentWithCourse>>(`/users/${userId}/enrollments`)
        .then((r) => r.data),
    enabled: !!userId,
    staleTime: 60 * 1000,
  })
}

export function useMyActiveEnrollments(userId: string | undefined) {
  return useQuery({
    queryKey: enrollmentKeys.myActive(userId),
    queryFn: () =>
      api
        .get<PaginatedData<UserEnrollmentItem>>(`/users/${userId}/enrollments`, {
          params: { status: 'ACTIVE', limit: 4 },
        })
        .then((r) => r.data),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    throwOnError: false,
    retry: false,
  })
}

export function useEnrollmentDetail(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.detail(enrollmentId),
    queryFn: () => api.get<EnrollmentDetail>(`/enrollments/${enrollmentId}`).then((r) => r.data),
    enabled: !!enrollmentId,
  })
}
