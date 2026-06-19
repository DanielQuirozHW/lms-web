import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { notificationKeys } from '@/hooks/queries/notifications'

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
