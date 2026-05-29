import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CourseModule, LessonSummary } from '@/types/models'
import { moduleKeys } from '@/hooks/queries/modules'

// ─── Module mutations ─────────────────────────────────────────────────────────

interface CreateModuleInput {
  title: string
  description?: string
  unlockAfterDays?: number
}

export function useCreateModule(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateModuleInput) =>
      api.post<CourseModule>(`/courses/${courseId}/modules`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function useUpdateModule(courseId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateModuleInput>) =>
      api.patch<CourseModule>(`/courses/${courseId}/modules/${moduleId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function useDeleteModule(courseId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}/modules/${moduleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function usePublishModule(courseId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api
        .patch<CourseModule>(`/courses/${courseId}/modules/${moduleId}/publish`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function useReorderModules(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (moduleIds: string[]) =>
      api.patch(`/courses/${courseId}/modules/reorder`, { moduleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

// ─── Lesson mutations ─────────────────────────────────────────────────────────

interface CreateLessonInput {
  title: string
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT'
  videoUrl?: string
  content?: string
  duration?: number
  isPreview?: boolean
}

export function useCreateLesson(courseId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLessonInput) =>
      api
        .post<LessonSummary>(`/courses/${courseId}/modules/${moduleId}/lessons`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function useUpdateLesson(courseId: string, moduleId: string, lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateLessonInput>) =>
      api
        .patch<LessonSummary>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function useDeleteLesson(courseId: string, moduleId: string, lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function usePublishLesson(courseId: string, moduleId: string, lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api
        .patch<LessonSummary>(
          `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/publish`
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}

export function useReorderLessons(courseId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lessonIds: string[]) =>
      api.patch(`/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { lessonIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) })
    },
  })
}
