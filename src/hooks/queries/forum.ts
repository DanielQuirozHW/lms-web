import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ForumThread, ForumPost } from '@/types/models'
import type { PaginatedData } from '@/types/api'

// Extends with optional embedded author the API may include
export interface ForumThreadWithAuthor extends ForumThread {
  author?: { firstName: string; lastName: string; avatarUrl: string | null } | null
}

export interface ForumPostWithAuthor extends ForumPost {
  author?: { firstName: string; lastName: string; avatarUrl: string | null } | null
}

export interface ForumThreadDetailFull extends ForumThreadWithAuthor {
  posts: ForumPostWithAuthor[]
}

export const forumKeys = {
  all: ['forum'] as const,
  threads: (courseId: string) => [...forumKeys.all, 'threads', courseId] as const,
  thread: (threadId: string) => [...forumKeys.all, 'thread', threadId] as const,
}

export function useThreads(courseId: string) {
  return useQuery({
    queryKey: forumKeys.threads(courseId),
    queryFn: () =>
      api
        .get<PaginatedData<ForumThreadWithAuthor>>('/forum/threads', { params: { courseId } })
        .then((r) => r.data),
    enabled: !!courseId,
    staleTime: 60 * 1000,
  })
}

export function useThread(threadId: string) {
  return useQuery({
    queryKey: forumKeys.thread(threadId),
    queryFn: () => api.get<ForumThreadDetailFull>(`/forum/threads/${threadId}`).then((r) => r.data),
    enabled: !!threadId,
    staleTime: 30 * 1000,
  })
}
