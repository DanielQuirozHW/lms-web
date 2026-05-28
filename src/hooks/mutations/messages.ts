import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Message } from '@/types/models'
import { messageKeys } from '@/hooks/queries/messages'

export function useSendMessage(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) =>
      api.post<Message>(`/messages/${userId}`, { content }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversation(userId) })
      queryClient.invalidateQueries({ queryKey: messageKeys.inbox() })
    },
  })
}

export function useMarkRead(userId: string) {
  return useMutation({
    mutationFn: async () => {
      await api.patch(`/messages/${userId}/read`)
      // 204 — no response body
    },
  })
}
