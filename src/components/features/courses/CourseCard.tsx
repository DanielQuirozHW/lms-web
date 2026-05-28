'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import type { Course } from '@/types/models'

// Extends the base Course type with fields the API may embed in list responses
export interface CatalogCourse extends Course {
  category?: { id: string; name: string; slug: string } | null
  instructor?: { firstName: string; lastName: string } | null
  averageRating?: number | null
  totalRatings?: number | null
}

interface CourseCardProps {
  course: CatalogCourse
  enrollmentProgress?: number
}

export function CourseCard({ course, enrollmentProgress }: CourseCardProps) {
  const instructorName = course.instructor
    ? `${course.instructor.firstName} ${course.instructor.lastName}`
    : null

  const isEnrolled = enrollmentProgress !== undefined

  return (
    <Link
      href={`/courses/${course.id}`}
      className={cn(
        'group border-nexus-border bg-nexus-card flex flex-col overflow-hidden rounded-xl border',
        'transition-transform duration-200 hover:scale-[1.02]'
      )}
      aria-label={course.title}
    >
      {/* Cover image — 16:9 */}
      <div className="bg-nexus-bg relative aspect-video overflow-hidden">
        {course.coverUrl ? (
          <Image
            src={course.coverUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="bg-nexus-card flex h-full items-center justify-center">
            <BookOpen className="text-nexus-muted/40 h-10 w-10" aria-hidden="true" />
          </div>
        )}

        {/* Category badge */}
        {course.category && (
          <span className="bg-nexus-bg/90 text-nexus-text absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
            {course.category.name}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title — max 2 lines */}
        <h3 className="text-nexus-text line-clamp-2 text-sm leading-snug font-semibold">
          {course.title}
        </h3>

        {/* Instructor */}
        {instructorName && <p className="text-nexus-muted truncate text-xs">{instructorName}</p>}

        {/* Rating */}
        {course.averageRating != null && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="text-nexus-text text-xs font-medium">
              {course.averageRating.toFixed(1)}
            </span>
            {course.totalRatings != null && (
              <span className="text-nexus-muted text-xs">({course.totalRatings})</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <p
          className={cn(
            'text-sm font-bold',
            course.price === null ? 'text-nexus-success' : 'text-nexus-text'
          )}
        >
          {course.price === null ? 'Gratis' : formatPrice(course.price)}
        </p>

        {/* Enrollment progress bar */}
        {isEnrolled && (
          <div className="space-y-1">
            <div
              className="bg-nexus-border h-1 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={enrollmentProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${enrollmentProgress}% completado`}
            >
              <div
                className="bg-nexus-accent h-full rounded-full transition-all"
                style={{ width: `${enrollmentProgress}%` }}
              />
            </div>
            <p className="text-nexus-muted text-[10px]">{enrollmentProgress}% completado</p>
          </div>
        )}
      </div>
    </Link>
  )
}
