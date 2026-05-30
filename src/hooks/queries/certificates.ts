import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Certificate } from '@/types/models'

export const certificateKeys = {
  all: ['certificates'] as const,
  list: () => [...certificateKeys.all, 'list'] as const,
  detail: (code: string) => [...certificateKeys.all, 'detail', code] as const,
}

export function useCertificates() {
  return useQuery({
    queryKey: certificateKeys.list(),
    queryFn: () => api.get<Certificate[]>('/certificates').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
