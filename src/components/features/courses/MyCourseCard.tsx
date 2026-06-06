'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Award, RotateCcw, Loader2, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { useEnrollMutation } from '@/hooks/mutations/enrollments'
import { useGenerateCertificate } from '@/hooks/mutations/certificates'
import { isApiError } from '@/lib/api'
import type { EnrollmentDetail, EnrollmentStatus } from '@/types/models'
import type { CatalogCourse } from '@/types/models'

const statusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'En progreso',
    className: 'bg-nexus-accent/15 text-nexus-accent',
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-nexus-success/15 text-nexus-success',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-nexus-muted/10 text-nexus-muted',
  },
}

export interface MyCourseCardProps {
  enrollment: EnrollmentDetail
  course: CatalogCourse
}

export function MyCourseCard({ enrollment, course }: MyCourseCardProps) {
  const router = useRouter()
  const { mutate: enroll, isPending } = useEnrollMutation()
  const { mutate: generateCert, isPending: isGenerating } = useGenerateCertificate()

  const pct = Math.round(enrollment.progress?.progressPercentage ?? 0)
  const { status } = enrollment
  const config = statusConfig[status]
  const instructorName = course.instructor
    ? `${course.instructor.firstName} ${course.instructor.lastName}`
    : null

  // Link to course detail — the /learn route requires a lesson ID not available here
  const continuePath = `/courses/${enrollment.courseId}`

  function handleReenroll() {
    enroll(
      { courseId: enrollment.courseId },
      {
        onSuccess: () => {
          toast.success('¡Te reinscribiste exitosamente!')
          router.refresh()
        },
        onError: (error) => {
          if (isApiError(error) && error.response?.data.statusCode === 409) {
            // Race condition: already enrolled — just refresh to show current state
            router.refresh()
          } else {
            toast.error('No se pudo reinscribir. Intentá de nuevo.')
          }
        },
      }
    )
  }

  return (
    <div className="border-nexus-border bg-nexus-card flex flex-col overflow-hidden rounded-xl border">
      {/* Cover */}
      <div className="bg-nexus-bg relative aspect-video overflow-hidden">
        {course.coverUrl ? (
          <Image
            src={course.coverUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="text-nexus-muted/40 h-10 w-10" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title + instructor */}
        <div>
          <h3 className="text-nexus-text line-clamp-2 text-sm leading-snug font-semibold">
            {course.title}
          </h3>
          {instructorName && (
            <p className="text-nexus-muted mt-0.5 truncate text-xs">{instructorName}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div
            className="bg-nexus-border h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso: ${pct}%`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'COMPLETED' ? 'bg-nexus-success' : 'bg-nexus-accent'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-nexus-muted text-xs">{pct}% completado</p>
        </div>

        {/* Status badge + last activity */}
        <div className="flex items-center justify-between">
          <span
            className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', config.className)}
          >
            {config.label}
          </span>
          <time
            dateTime={enrollment.updatedAt}
            className="text-nexus-muted text-[10px]"
            title={enrollment.updatedAt}
          >
            {formatRelativeTime(enrollment.updatedAt)}
          </time>
        </div>

        {/* Progress link */}
        <Link
          href={`/courses/${enrollment.courseId}/progress?enrollmentId=${enrollment.id}`}
          className="text-nexus-muted hover:text-nexus-accent flex items-center gap-1 text-xs transition-colors"
        >
          <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
          Ver mi progreso
        </Link>

        <div className="flex-1" />

        {/* CTA */}
        {status === 'ACTIVE' && (
          <Link
            href={continuePath}
            className={buttonVariants({
              size: 'sm',
              className: 'bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white',
            })}
          >
            Continuar
          </Link>
        )}

        {status === 'COMPLETED' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={() =>
              generateCert(
                { enrollmentId: enrollment.id },
                { onSuccess: () => router.push('/certificates') }
              )
            }
            className="border-nexus-border text-nexus-muted w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Award className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isGenerating ? 'Generando...' : 'Ver certificado'}
          </Button>
        )}

        {status === 'CANCELLED' && (
          <Button
            size="sm"
            onClick={handleReenroll}
            disabled={isPending}
            className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isPending ? 'Procesando...' : 'Reinscribirme'}
          </Button>
        )}
      </div>
    </div>
  )
}
