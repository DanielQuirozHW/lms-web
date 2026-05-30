import { useQuery } from '@tanstack/react-query'
import api, { isApiError } from '@/lib/api'
import type { LessonNote } from '@/types/models'

export const noteKeys = {
  all: ['notes'] as const,
  detail: (lessonId: string) => [...noteKeys.all, 'detail', lessonId] as const,
}

export function useLessonNote(lessonId: string) {
  return useQuery({
    queryKey: noteKeys.detail(lessonId),
    queryFn: async () => {
      try {
        return await api.get<LessonNote>(`/lessons/${lessonId}/notes`).then((r) => r.data)
      } catch (err) {
        // 404 means the note doesn't exist yet — return null instead of throwing
        if (isApiError(err) && err.response?.data.statusCode === 404) return null
        throw err
      }
    },
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  })
}
