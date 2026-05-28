import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Conversation, Message, PublicUser } from '@/types/models'
import type { PaginatedData } from '@/types/api'

// Extends Conversation with the partner's public profile — the API may embed it
export interface ConversationWithPartner extends Conversation {
  partner?: Pick<PublicUser, 'id' | 'firstName' | 'lastName' | 'avatarUrl'> | null
}

export const messageKeys = {
  all: ['messages'] as const,
  inbox: () => [...messageKeys.all, 'inbox'] as const,
  conversation: (userId: string) => [...messageKeys.all, 'conversation', userId] as const,
}

export function useInbox() {
  return useQuery({
    queryKey: messageKeys.inbox(),
    queryFn: () => api.get<PaginatedData<ConversationWithPartner>>('/messages').then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useConversation(userId: string) {
  return useQuery({
    queryKey: messageKeys.conversation(userId),
    queryFn: () => api.get<PaginatedData<Message>>(`/messages/${userId}`).then((r) => r.data),
    enabled: !!userId,
    staleTime: 0, // always fresh — real-time updates via WebSocket
  })
}
