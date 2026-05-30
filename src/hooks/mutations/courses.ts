import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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

export function useUploadCourseCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, courseId }: { file: File; courseId: string }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('courseId', courseId)
      // Axios auto-sets multipart/form-data with boundary from FormData
      const r = await api.post<{ url: string }>('/upload/course-cover', form)
      return r.data.url
    },
    onSuccess: (_url, vars) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(vars.courseId) })
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
    },
  })
}

export function useDuplicateCourse(courseId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => api.post<Course>(`/courses/${courseId}/duplicate`).then((r) => r.data),
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.my() })
      router.push(`/instructor/courses/${newCourse.id}/edit`)
    },
    onError: () => {
      toast.error('No se pudo duplicar el curso')
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
