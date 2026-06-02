'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, BookOpen, ShoppingCart, Info, Key } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { useEnrollMutation } from '@/hooks/mutations/enrollments'
import { isApiError } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { EnrollmentType } from '@/types/models'

const codeSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres'),
})

interface EnrollButtonProps {
  courseId: string
  isEnrolled: boolean
  enrollmentType: EnrollmentType
  price: number | null
  firstLessonId?: string
}

export function EnrollButton({
  courseId,
  isEnrolled,
  enrollmentType,
  price,
  firstLessonId,
}: EnrollButtonProps) {
  const router = useRouter()
  const { mutate, isPending } = useEnrollMutation()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const learnPath = firstLessonId
    ? `/courses/${courseId}/learn/${firstLessonId}`
    : `/courses/${courseId}`

  // Already enrolled — same for all types
  if (isEnrolled) {
    return (
      <Link
        href={learnPath}
        className={buttonVariants({
          className: 'bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white',
        })}
      >
        <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
        Continuar aprendiendo
      </Link>
    )
  }

  // ASSIGNED — no self-enrollment
  if (enrollmentType === 'ASSIGNED') {
    return (
      <div className="border-nexus-border flex items-start gap-3 rounded-lg border p-4">
        <Info className="text-nexus-muted mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-nexus-muted text-sm leading-relaxed">
          Este curso requiere asignación. Contactá a un administrador para acceder.
        </p>
      </div>
    )
  }

  // CODE — code input + enroll button
  if (enrollmentType === 'CODE') {
    function handleCodeEnroll() {
      const result = codeSchema.safeParse({ code })
      if (!result.success) {
        setCodeError(result.error.issues[0]?.message ?? 'Código inválido')
        return
      }
      setCodeError(null)
      mutate(
        { courseId, code: result.data.code },
        {
          onSuccess: () => {
            toast.success('¡Te inscribiste exitosamente!')
            router.push(learnPath)
          },
          onError: (error) => {
            if (isApiError(error)) {
              const status = error.response?.data.statusCode
              if (status === 400 || status === 403) {
                setCodeError('Código inválido o expirado')
              } else if (status === 409) {
                router.push(learnPath)
              } else {
                toast.error('No se pudo completar la inscripción. Intentá de nuevo.')
              }
            } else {
              toast.error('No se pudo completar la inscripción. Intentá de nuevo.')
            }
          },
        }
      )
    }

    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="relative">
            <Key
              className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                if (codeError) setCodeError(null)
              }}
              placeholder="Ingresá tu código de acceso"
              aria-label="Código de acceso"
              className={cn(
                'border-nexus-border bg-nexus-card text-nexus-text w-full rounded-lg border py-2 pr-3 pl-9 text-sm',
                'placeholder:text-nexus-muted/60',
                'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
                'transition-colors',
                codeError && 'border-nexus-danger focus:border-nexus-danger'
              )}
            />
          </div>
          {codeError && <p className="text-nexus-danger text-xs">{codeError}</p>}
        </div>
        <Button
          onClick={handleCodeEnroll}
          disabled={isPending}
          className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Verificando...
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" aria-hidden="true" />
              Inscribirme con código
            </>
          )}
        </Button>
      </div>
    )
  }

  // FREE or PAID — standard enroll
  function handleEnroll() {
    mutate(
      { courseId },
      {
        onSuccess: () => {
          toast.success('¡Te inscribiste exitosamente!')
          router.push(learnPath)
        },
        onError: (error) => {
          if (isApiError(error)) {
            const status = error.response?.data.statusCode
            if (status === 403) {
              toast.error('Verificá tu email para inscribirte')
            } else if (status === 409) {
              router.push(learnPath)
            } else {
              toast.error('No se pudo completar la inscripción. Intentá de nuevo.')
            }
          } else {
            toast.error('No se pudo completar la inscripción. Intentá de nuevo.')
          }
        },
      }
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleEnroll}
        disabled={isPending}
        className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Procesando...
          </>
        ) : enrollmentType === 'PAID' ? (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            Inscribirme por {formatPrice(price ?? 0)}
          </>
        ) : (
          <>
            <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
            Inscribirme
          </>
        )}
      </Button>
      {enrollmentType === 'PAID' && (
        <p className="text-nexus-faint text-center text-xs">El pago se procesará próximamente</p>
      )}
    </div>
  )
}
