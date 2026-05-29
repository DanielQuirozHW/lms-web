import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Category } from '@/types/models'
import { categoryKeys } from '@/hooks/queries/courses'

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.post<Category>('/categories', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  })
}

export function useUpdateCategory(categoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.patch<Category>(`/categories/${categoryId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => api.delete(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  })
}
