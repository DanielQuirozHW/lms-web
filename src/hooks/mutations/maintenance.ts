import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api, { isApiError } from '@/lib/api'
import type { MaintenanceStatus } from '@/types/models'

const maintenanceKeys = {
  all: ['maintenance'] as const,
  status: () => [...maintenanceKeys.all, 'status'] as const,
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: maintenanceKeys.status(),
    queryFn: () => api.get<MaintenanceStatus>('/admin/maintenance').then((r) => r.data),
    staleTime: 30 * 1000,
  })
}

interface ToggleMaintenanceInput {
  isEnabled: boolean
  message?: string | null
  estimatedEnd?: string | null
}

export function useToggleMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ToggleMaintenanceInput) =>
      api.post<MaintenanceStatus>('/admin/maintenance', data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(maintenanceKeys.status(), data)
      toast.success(data.isEnabled ? 'Mantenimiento activado' : 'Mantenimiento desactivado')
    },
    onError: (error) => {
      toast.error(
        isApiError(error)
          ? error.response?.data.message
          : 'Error al cambiar el estado de mantenimiento'
      )
    },
  })
}
