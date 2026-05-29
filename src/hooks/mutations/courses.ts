import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course } from '@/types/models'
import { courseKeys } from '@/hooks/queries/courses'

interface CreateCourseInput {
  title: string
  description?: string
  coverUrl?: string
  categoryId?: string
  price?: number
}

type UpdateCourseInput = Partial<CreateCourseInput>

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCourseInput) => api.post<Course>('/courses', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
    },
  })
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCourseInput) =>
      api.patch<Course>(`/courses/${courseId}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(courseId), updated)
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export function usePublishCourse(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.patch<Course>(`/courses/${courseId}/publish`).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(courseId), updated)
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export function useArchiveCourse(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.patch<Course>(`/courses/${courseId}/archive`).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(courseId), updated)
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
    },
  })
}
