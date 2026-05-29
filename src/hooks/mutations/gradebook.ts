import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { GradebookCategory, GradebookItem } from '@/types/models'
import { gradebookKeys } from '@/hooks/queries/gradebook'

export function useCreateGradebookCategory(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; weight: number }) =>
      api
        .post<GradebookCategory>(`/courses/${courseId}/gradebook/categories`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradebookKeys.structure(courseId) })
    },
  })
}

export function useCreateGradebookItem(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      categoryId: string
      lessonId: string
      maxScore: number
      weight?: number
    }) => api.post<GradebookItem>(`/courses/${courseId}/gradebook/items`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradebookKeys.structure(courseId) })
    },
  })
}

export function useDeleteGradebookItem(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/courses/${courseId}/gradebook/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradebookKeys.structure(courseId) })
    },
  })
}
