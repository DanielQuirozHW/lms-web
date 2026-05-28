'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import type { EnrollmentDetail } from '@/types/models'
import { cn } from '@/lib/utils'

// The API embeds course data in enrollment responses — this extends the base type.
export interface DashboardEnrollment extends EnrollmentDetail {
  course?: {
    title?: string
    coverUrl?: string | null
    instructor?: { firstName: string; lastName: string } | null
  }
}

interface InProgressCoursesProps {
  enrollments: DashboardEnrollment[]
}

export function InProgressCourses({ enrollments }: InProgressCoursesProps) {
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
    <ul className="space-y-3" aria-label="Cursos en progreso">
      {enrollments.map((enrollment) => {
        const course = enrollment.course
        const pct = Math.round(enrollment.progress.progressPercentage)
        const instructorName = course?.instructor
          ? `${course.instructor.firstName} ${course.instructor.lastName}`
          : null

        return (
          <li
            key={enrollment.id}
            className="border-nexus-border bg-nexus-card flex items-start gap-4 rounded-xl border p-4"
          >
            {/* Cover thumbnail */}
            <div className="bg-nexus-bg relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
              {course?.coverUrl ? (
                <Image
                  src={course.coverUrl}
                  alt={course.title ?? 'Portada del curso'}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="text-nexus-muted h-6 w-6" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Info + progress */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div>
                <p className="text-nexus-text truncate text-sm font-semibold">
                  {course?.title ?? 'Curso sin título'}
                </p>
                {instructorName && (
                  <p className="text-nexus-muted truncate text-xs">{instructorName}</p>
                )}
              </div>

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
                      'bg-nexus-accent h-full rounded-full transition-all',
                      pct === 100 && 'bg-nexus-success'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-nexus-muted text-xs">{pct}% completado</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/courses/${enrollment.courseId}`}
              className={buttonVariants({
                size: 'sm',
                className: 'bg-nexus-accent hover:bg-nexus-accent-hover shrink-0 text-white',
              })}
            >
              Continuar
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
