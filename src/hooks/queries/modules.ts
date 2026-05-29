import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CourseModule, LessonSummary } from '@/types/models'

// Extends LessonSummary with fields the API may embed for the editor
export interface LessonWithDetails extends LessonSummary {
  videoUrl?: string | null
  content?: string | null
}

export interface ModuleWithLessons extends CourseModule {
  lessons: LessonWithDetails[]
}

export const moduleKeys = {
  all: ['modules'] as const,
  list: (courseId: string) => [...moduleKeys.all, 'list', courseId] as const,
}

export function useModules(courseId: string) {
  return useQuery({
    queryKey: moduleKeys.list(courseId),
    queryFn: () => api.get<ModuleWithLessons[]>(`/courses/${courseId}/modules`).then((r) => r.data),
    enabled: !!courseId,
    staleTime: 60 * 1000,
  })
}
