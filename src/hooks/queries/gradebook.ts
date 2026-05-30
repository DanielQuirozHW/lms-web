import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Gradebook, StudentGrade } from '@/types/models'

export const gradebookKeys = {
  all: ['gradebook'] as const,
  structure: (courseId: string) => [...gradebookKeys.all, 'structure', courseId] as const,
  studentGrade: (courseId: string, enrollmentId: string) =>
    [...gradebookKeys.all, 'student', courseId, enrollmentId] as const,
}

export function useGradebook(courseId: string) {
  return useQuery({
    queryKey: gradebookKeys.structure(courseId),
    queryFn: () => api.get<Gradebook>(`/courses/${courseId}/gradebook`).then((r) => r.data),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useStudentGrade(courseId: string, enrollmentId: string) {
  return useQuery({
    queryKey: gradebookKeys.studentGrade(courseId, enrollmentId),
    queryFn: () =>
      api
        .get<StudentGrade>(`/courses/${courseId}/gradebook/student/${enrollmentId}`)
        .then((r) => r.data),
    enabled: !!courseId && !!enrollmentId,
    staleTime: 5 * 60 * 1000,
  })
}
