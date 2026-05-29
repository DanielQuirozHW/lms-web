import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ForumThread, ForumPost } from '@/types/models'
import { forumKeys } from '@/hooks/queries/forum'

export function useCreateThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { title: string; courseId: string }) =>
      api.post<ForumThread>('/forum/threads', data).then((r) => r.data),
    onSuccess: (_thread, vars) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.threads(vars.courseId) })
    },
  })
}

export function useCreatePost(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) =>
      api.post<ForumPost>(`/forum/threads/${threadId}/posts`, { content }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.thread(threadId) })
    },
  })
}

export function useVotePost(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, value }: { postId: string; value: 1 | -1 }) =>
      api.post(`/forum/threads/${threadId}/posts/${postId}/vote`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.thread(threadId) })
    },
  })
}

export function useAcceptAnswer(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => api.patch(`/forum/threads/${threadId}/posts/${postId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.thread(threadId) })
    },
  })
}

export function useDeletePost(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => api.delete(`/forum/threads/${threadId}/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.thread(threadId) })
    },
  })
}
