import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { bookmarkKeys } from '@/hooks/queries/bookmarks'
import type { BookmarkCheck } from '@/types/models'

export function useToggleBookmark(lessonId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isCurrentlyBookmarked: boolean) => {
      if (isCurrentlyBookmarked) {
        await api.delete(`/bookmarks/${lessonId}`)
        return false
      } else {
        await api.post('/bookmarks', { lessonId })
        return true
      }
    },
    onMutate: async (isCurrentlyBookmarked) => {
      // Optimistic update: flip immediately
      await queryClient.cancelQueries({ queryKey: bookmarkKeys.check(lessonId) })
      const prev = queryClient.getQueryData<BookmarkCheck>(bookmarkKeys.check(lessonId))
      queryClient.setQueryData<BookmarkCheck>(bookmarkKeys.check(lessonId), {
        isBookmarked: !isCurrentlyBookmarked,
      })
      return { prev }
    },
    onError: (_err, _vars, context) => {
      // Revert optimistic update
      if (context?.prev !== undefined) {
        queryClient.setQueryData(bookmarkKeys.check(lessonId), context.prev)
      }
      toast.error('No se pudo actualizar el guardado. Intentá de nuevo.')
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.check(lessonId) })
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() })
    },
  })
}
