import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api, { isApiError } from '@/lib/api'
import { globalAnnouncementKeys } from '@/hooks/queries/announcements-global'
import type { GlobalAnnouncement, GlobalAnnouncementType } from '@/types/models'

export interface AnnouncementInput {
  title: string
  message: string
  type: GlobalAnnouncementType
  isActive: boolean
  startsAt?: string | null
  endsAt?: string | null
}

export function useCreateGlobalAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AnnouncementInput) =>
      api.post<GlobalAnnouncement>('/announcements/global', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalAnnouncementKeys.all })
      toast.success('Alerta creada correctamente')
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.response?.data.message : 'Error al crear la alerta')
    },
  })
}

export function useUpdateGlobalAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnouncementInput> }) =>
      api.patch<GlobalAnnouncement>(`/announcements/global/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalAnnouncementKeys.all })
    },
    onError: (error) => {
      toast.error(
        isApiError(error) ? error.response?.data.message : 'Error al actualizar la alerta'
      )
    },
  })
}

export function useDeleteGlobalAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/global/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalAnnouncementKeys.all })
      toast.success('Alerta eliminada')
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.response?.data.message : 'Error al eliminar la alerta')
    },
  })
}
