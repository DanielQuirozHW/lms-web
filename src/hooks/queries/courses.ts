import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course, CourseDetail } from '@/types/models'
import type { PaginatedData } from '@/types/api'

interface CoursesFilter {
  page?: number
  limit?: number
  categoryId?: string
}

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: CoursesFilter) => [...courseKeys.lists(), filters] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
  my: () => [...courseKeys.all, 'my'] as const,
  myList: (filters: { page?: number; limit?: number }) => [...courseKeys.my(), filters] as const,
}

export function useCourses(filters: CoursesFilter = {}) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () =>
      api
        .get<{ data: PaginatedData<Course> }>('/courses', { params: filters })
        .then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => api.get<{ data: CourseDetail }>(`/courses/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyCourses(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: courseKeys.myList(filters),
    queryFn: () =>
      api
        .get<{ data: PaginatedData<Course> }>('/courses/my', { params: filters })
        .then((r) => r.data.data),
  })
}
