'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGenerateCertificate } from '@/hooks/mutations/certificates'

interface GenerateCertificateButtonProps {
  enrollmentId: string
}

export function GenerateCertificateButton({ enrollmentId }: GenerateCertificateButtonProps) {
  const router = useRouter()
  const { mutate: generate, isPending } = useGenerateCertificate()

  function handleClick() {
    generate({ enrollmentId }, { onSuccess: () => router.push('/certificates') })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="bg-nexus-success hover:bg-nexus-success/90 text-white"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Generando...
        </>
      ) : (
        <>
          <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />
          Obtener certificado
        </>
      )}
    </Button>
  )
}
