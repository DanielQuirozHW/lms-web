'use client'

import { useRouter } from 'next/navigation'
import { Loader2, BookOpen, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { useEnrollMutation } from '@/hooks/mutations/enrollments'
import { isApiError } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface EnrollButtonProps {
  courseId: string
  isEnrolled: boolean
  price: number | null
  // ID of the first lesson — used to build the direct learn path
  firstLessonId?: string
}

export function EnrollButton({ courseId, isEnrolled, price, firstLessonId }: EnrollButtonProps) {
  const router = useRouter()
  const { mutate, isPending } = useEnrollMutation()

  const learnPath = firstLessonId
    ? `/courses/${courseId}/learn/${firstLessonId}`
    : `/courses/${courseId}`

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

  function handleEnroll() {
    mutate(courseId, {
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
            // Already enrolled — navigate directly
            router.push(learnPath)
          } else {
            toast.error('No se pudo completar la inscripción. Intentá de nuevo.')
          }
        } else {
          toast.error('No se pudo completar la inscripción. Intentá de nuevo.')
        }
      },
    })
  }

  return (
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
      ) : price === null ? (
        <>
          <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
          Inscribirme gratis
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
          Comprar por {formatPrice(price)}
        </>
      )}
    </Button>
  )
}
