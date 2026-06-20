'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { useMyActiveEnrollments } from '@/hooks/queries/enrollments'
import { cn } from '@/lib/utils'

export function InProgressCourses() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data, isLoading } = useMyActiveEnrollments(userId)
  const enrollments = data?.data ?? []

  if (isLoading) return <LoadingSpinner rows={3} />

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Sin cursos en progreso"
        description="Explorá el catálogo y comenzá a aprender"
        className="border-nexus-border min-h-50"
      />
    )
  }

  return (
    <ul className="flex flex-col gap-3.5" aria-label="Cursos en progreso">
      {enrollments.map((enrollment) => {
        const pct = Math.round(enrollment.progressPercentage ?? 0)

        return (
          <li
            key={enrollment.enrollmentId}
            className="border-nexus-border bg-nexus-card flex cursor-pointer items-center gap-4 rounded-[16px] border p-[15px] transition-all hover:-translate-y-0.5"
            style={{ boxShadow: 'var(--nexus-card-shadow)' }}
          >
            {/* Square thumbnail */}
            <div
              className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[14px]"
              style={{ boxShadow: '0 10px 20px -10px rgba(31,30,46,0.45)' }}
            >
              {enrollment.coverUrl ? (
                <Image
                  src={enrollment.coverUrl}
                  alt={enrollment.courseTitle}
                  fill
                  sizes="62px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8b7cff, #6d5bf0)' }}
                >
                  <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info + progress */}
            <div className="flex min-w-0 flex-1 flex-col gap-1.75">
              {enrollment.categoryName && (
                <span className="text-nexus-accent inline-block max-w-full truncate text-[11px] font-semibold tracking-wider uppercase">
                  {enrollment.categoryName}
                </span>
              )}
              <p className="text-nexus-text truncate font-bold" style={{ fontSize: '15.5px' }}>
                {enrollment.courseTitle}
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--nexus-border)' }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso: ${pct}%`}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      pct === 100 && 'opacity-80'
                    )}
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(135deg, #8b7cff, #6d5bf0)',
                    }}
                  />
                </div>
                <span className="text-nexus-text w-9 shrink-0 text-right text-[12.5px] font-extrabold">
                  {pct}%
                </span>
              </div>
              {enrollment.totalLessons > 0 && (
                <p className="text-nexus-muted text-[11.5px]">
                  {enrollment.completedLessons} / {enrollment.totalLessons} lecciones
                </p>
              )}
            </div>

            {/* CTA */}
            <Link
              href={`/courses/${enrollment.courseId}`}
              className="inline-flex shrink-0 items-center gap-1.75 rounded-xl px-4.25 py-2.75 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #7c6cff, #6d5bf0)',
                boxShadow: '0 10px 20px -10px rgba(109,91,240,0.7)',
              }}
            >
              Continuar
              <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
