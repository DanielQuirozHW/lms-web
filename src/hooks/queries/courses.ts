import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course, CourseDetail, Category, CoursesFilter } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })
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
      api.get<PaginatedData<Course>>('/courses', { params: filters }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => api.get<CourseDetail>(`/courses/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyCourses(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: courseKeys.myList(filters),
    queryFn: () =>
      api.get<PaginatedData<Course>>('/courses/my', { params: filters }).then((r) => r.data),
  })
}
