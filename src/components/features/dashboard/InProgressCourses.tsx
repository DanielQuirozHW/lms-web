'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { useMyActiveEnrollments } from '@/hooks/queries/enrollments'

const COURSE_GRADIENTS = [
  'linear-gradient(135deg,#8B7CFF,#6D5BF0)',
  'linear-gradient(135deg,#FBB54D,#EA8C0C)',
  'linear-gradient(135deg,#46C2F0,#0E9FD9)',
  'linear-gradient(135deg,#3BDB9E,#10B981)',
]

const COURSE_BTN_SHADOWS = [
  '0 10px 20px -10px rgba(109,91,240,0.7)',
  '0 10px 20px -10px rgba(234,140,12,0.6)',
  '0 10px 20px -10px rgba(14,159,217,0.6)',
  '0 10px 20px -10px rgba(16,185,129,0.6)',
]

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
      {enrollments.map((enrollment, index) => {
        const pct = Math.round(enrollment.progressPercentage ?? 0)
        const paletteIdx = index % 4
        const gradient = COURSE_GRADIENTS[paletteIdx]
        const btnShadow = COURSE_BTN_SHADOWS[paletteIdx]

        return (
          <li
            key={enrollment.enrollmentId}
            className="nexus-ccard border-nexus-border bg-nexus-card flex cursor-pointer items-center gap-4 rounded-[16px] border p-3.75"
            style={{ boxShadow: 'var(--nexus-card-shadow)' }}
          >
            {/* Thumbnail — palette gradient fallback */}
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
                  style={{ background: gradient }}
                >
                  <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Chip + lesson count row */}
              <div className="mb-1.75 flex items-center gap-2">
                {enrollment.categoryName && (
                  <span
                    className="shrink-0 rounded-full px-2.25 py-0.75 text-[11px] font-bold tracking-[.03em] uppercase"
                    style={{
                      background: `var(--chip-${paletteIdx}-bg)`,
                      color: `var(--chip-${paletteIdx}-color)`,
                    }}
                  >
                    {enrollment.categoryName}
                  </span>
                )}
                {enrollment.totalLessons > 0 && (
                  <span className="text-nexus-faint text-[12px]">
                    {enrollment.completedLessons} / {enrollment.totalLessons} lecciones
                  </span>
                )}
              </div>

              {/* Title */}
              <p
                className="text-nexus-text mb-2.25 truncate font-bold"
                style={{ fontSize: '15.5px' }}
              >
                {enrollment.courseTitle}
              </p>

              {/* Progress bar + percentage */}
              <div className="flex items-center gap-2.75">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--nexus-progress-track)' }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso: ${pct}%`}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: gradient }}
                  />
                </div>
                <span
                  className="text-nexus-text w-9 shrink-0 text-right font-extrabold"
                  style={{ fontSize: '12.5px' }}
                >
                  {pct}%
                </span>
              </div>
            </div>

            {/* Continuar */}
            <Link
              href={`/courses/${enrollment.courseId}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4.25 py-2.75 text-sm font-bold text-white transition-[filter] hover:brightness-[1.07]"
              style={{ background: gradient, boxShadow: btnShadow }}
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
