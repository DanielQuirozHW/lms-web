import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api, { isApiError } from '@/lib/api'
import { certificateKeys } from '@/hooks/queries/certificates'
import type { Certificate } from '@/types/models'

export function useGenerateCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ enrollmentId }: { enrollmentId: string }) =>
      api.post<Certificate>('/certificates', { enrollmentId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all })
      toast.success('¡Certificado generado!')
    },
    onError: (error) => {
      if (isApiError(error) && error.response?.data.statusCode === 403) {
        toast.error('Debés completar el curso para obtener el certificado')
      } else {
        toast.error('No se pudo generar el certificado. Intentá de nuevo.')
      }
    },
  })
}
