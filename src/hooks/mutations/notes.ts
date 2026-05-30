import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { noteKeys } from '@/hooks/queries/notes'
import type { LessonNote } from '@/types/models'

export function useSaveNote(lessonId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ content }: { content: string }) =>
      api.put<LessonNote>(`/lessons/${lessonId}/notes`, { content }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(noteKeys.detail(lessonId), data)
    },
  })
}

export function useDeleteNote(lessonId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete(`/lessons/${lessonId}/notes`),
    onSuccess: () => {
      queryClient.setQueryData(noteKeys.detail(lessonId), null)
    },
  })
}
