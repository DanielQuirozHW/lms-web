import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export const userKeys = {
  all: ['users'] as const,
  list: (page: number, limit: number) => [...userKeys.all, 'list', page, limit] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export function useUsers(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: userKeys.list(page, limit),
    queryFn: () =>
      api.get<PaginatedData<User>>('/users', { params: { page, limit } }).then((r) => r.data),
    staleTime: 60 * 1000,
  })
}
