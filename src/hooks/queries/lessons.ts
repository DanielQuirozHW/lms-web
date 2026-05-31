import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { LessonDetail, LessonProgress } from '@/types/models'

export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  detail: (courseId: string, moduleId: string, lessonId: string) =>
    [...lessonKeys.all, 'detail', courseId, moduleId, lessonId] as const,
  progress: (courseId: string, lessonId: string) =>
    [...lessonKeys.all, 'progress', courseId, lessonId] as const,
}

export function useLessonDetail(courseId: string, moduleId: string, lessonId: string) {
  return useQuery({
    queryKey: lessonKeys.detail(courseId, moduleId, lessonId),
    queryFn: () =>
      api
        .get<LessonDetail>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`)
        .then((r) => r.data),
    enabled: !!(courseId && moduleId && lessonId),
    staleTime: 60 * 1000,
  })
}

export function useLessonProgress(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: lessonKeys.progress(courseId, lessonId),
    queryFn: () =>
      api
        .get<LessonProgress>(`/courses/${courseId}/lessons/${lessonId}/progress`)
        .then((r) => r.data),
    enabled: !!(courseId && lessonId),
    staleTime: 30 * 1000,
  })
}
