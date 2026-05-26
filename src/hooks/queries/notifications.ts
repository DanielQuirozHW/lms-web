import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Notification } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: { page?: number; limit?: number; isRead?: boolean }) =>
    [...notificationKeys.all, 'list', filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export function useNotifications(
  filters: { page?: number; limit?: number; isRead?: boolean } = {}
) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () =>
      api
        .get<PaginatedData<Notification>>('/notifications', { params: filters })
        .then((r) => r.data),
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () =>
      api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
