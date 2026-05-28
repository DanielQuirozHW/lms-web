import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types/models'

interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api.patch<User>('/users/me', data).then((r) => r.data),
    onSuccess: () => {
      // Invalidate any cached user queries
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      await api.patch('/users/me/password', data)
      // 204 — no response body
    },
  })
}

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: async (data: { password: string }) => {
      await api.delete('/users/me', { data })
      // 204 — no response body
    },
  })
}

export function useUploadAvatarMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      // Axios auto-sets multipart/form-data with boundary from FormData
      const r = await api.post<{ url: string }>('/upload/avatar', form)
      return r.data.url
    },
  })
}
