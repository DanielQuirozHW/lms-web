import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Bookmark, BookmarkCheck } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  list: (page: number) => [...bookmarkKeys.lists(), page] as const,
  check: (lessonId: string) => [...bookmarkKeys.all, 'check', lessonId] as const,
}

export function useBookmarks(page = 1, limit = 20) {
  return useQuery({
    queryKey: bookmarkKeys.list(page),
    queryFn: () =>
      api
        .get<PaginatedData<Bookmark>>('/bookmarks', { params: { page, limit } })
        .then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })
}

export function useBookmarkCheck(lessonId: string) {
  return useQuery({
    queryKey: bookmarkKeys.check(lessonId),
    queryFn: () => api.get<BookmarkCheck>(`/bookmarks/${lessonId}/check`).then((r) => r.data),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  })
}
