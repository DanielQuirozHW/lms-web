import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { GlobalAnnouncement } from '@/types/models'

export const globalAnnouncementKeys = {
  all: ['global-announcements'] as const,
  list: () => [...globalAnnouncementKeys.all, 'list'] as const,
}

export function useGlobalAnnouncements(initialData?: GlobalAnnouncement[]) {
  return useQuery({
    queryKey: globalAnnouncementKeys.list(),
    queryFn: () => api.get<GlobalAnnouncement[]>('/announcements/global').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    initialData,
  })
}
