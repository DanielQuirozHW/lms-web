import { useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import api, { isApiError } from '@/lib/api'
import type { User } from '@/types/models'

interface ImpersonateResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export function useImpersonateMutation() {
  const { data: session, update } = useSession()
  const router = useRouter()

  return useMutation({
    mutationFn: async (userId: string) => {
      const r = await api.post<ImpersonateResponse>(`/admin/impersonate/${userId}`)
      return r.data
    },
    onSuccess: async (data, userId) => {
      await update({
        impersonation: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          adminId: session?.user.id ?? '',
          impersonationTokenId: `imp_${userId}_${Date.now()}`,
        },
      })
      router.push('/dashboard')
      router.refresh()
    },
    onError: (error) => {
      if (isApiError(error)) {
        const status = error.response?.status
        if (status === 403) {
          toast.error('No se puede enmascarar a este usuario')
        } else if (status === 400) {
          toast.error('Ya estás en una sesión enmascarada')
        } else {
          toast.error('Error al intentar enmascarar usuario')
        }
      } else {
        toast.error('Error al intentar enmascarar usuario')
      }
    },
  })
}

export function useStopImpersonationMutation() {
  const { data: session, update } = useSession()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const r = await api.post<ImpersonateResponse>('/admin/impersonate/stop', {
        adminId: session?.impersonatedBy,
      })
      return r.data
    },
    onSuccess: async (data) => {
      await update({
        restoreAdmin: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        },
      })
      router.push('/admin/users')
      router.refresh()
    },
    onError: () => {
      toast.error('Error al restaurar la sesión. Recargá la página.')
    },
  })
}
