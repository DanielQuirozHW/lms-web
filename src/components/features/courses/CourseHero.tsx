'use client'

import Image from 'next/image'
import { Star, Users, BookOpen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import type { CourseDetail } from '@/types/models'
import type { RatingSummary } from '@/types/models'

// Extends CourseDetail with fields the API may embed in course detail responses
export interface CourseDetailFull extends CourseDetail {
  instructor?: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  } | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CourseHeroProps {
  course: CourseDetailFull
  rating: RatingSummary | null
}

function StarRating({ summary }: { summary: RatingSummary }) {
  // Normalise to 0–5
  const score5 =
    summary.scale === 'STARS_5'
      ? summary.averageScore
      : summary.scale === 'NUMERIC_10'
        ? summary.averageScore / 2
        : summary.averageScore / 20

  const filled = Math.round(score5)

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i <= filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-amber-400/40'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-white/90">{summary.averageScore.toFixed(1)}</span>
      <span className="text-xs text-white/60">({summary.totalRatings})</span>
    </div>
  )
}

function CourseInfo({
  course,
  rating,
  dark,
}: {
  course: CourseDetailFull
  rating: RatingSummary | null
  dark?: boolean
}) {
  const textPrimary = dark ? 'text-white' : 'text-nexus-text'
  const textMuted = dark ? 'text-white/70' : 'text-nexus-muted'
  const badgeBg = dark ? 'bg-nexus-accent/80 text-white' : 'bg-nexus-accent/15 text-nexus-accent'

  const instructorName = course.instructor
    ? `${course.instructor.firstName} ${course.instructor.lastName}`
    : null
  const initials = course.instructor
    ? `${course.instructor.firstName[0]}${course.instructor.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <div className="space-y-3">
      {/* Category badge */}
      {course.category && (
        <span
          className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeBg)}
        >
          {course.category.name}
        </span>
      )}

      {/* Title */}
      <h1 className={cn('text-2xl leading-tight font-bold md:text-3xl', textPrimary)}>
        {course.title}
      </h1>

      {/* Instructor */}
      {instructorName && (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={course.instructor?.avatarUrl ?? undefined} alt={instructorName} />
            <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className={cn('text-sm', textMuted)}>{instructorName}</span>
        </div>
      )}

      {/* Rating */}
      {rating &&
        (dark ? (
          <StarRating summary={rating} />
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => {
                const filled = Math.round(rating.averageScore)
                return (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i <= filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-amber-400/40'
                    )}
                    aria-hidden="true"
                  />
                )
              })}
            </div>
            <span className="text-nexus-text text-sm font-semibold">
              {rating.averageScore.toFixed(1)}
            </span>
            <span className="text-nexus-muted text-xs">({rating.totalRatings})</span>
          </div>
        ))}

      {/* Stats row */}
      <div className={cn('flex items-center gap-4 text-xs', textMuted)}>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          {course.lessonsCount} lecciones
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {course.enrollmentsCount} estudiantes
        </span>
      </div>

      {/* Price */}
      <p
        className={cn(
          'text-xl font-bold',
          course.price === null ? 'text-nexus-success' : dark ? 'text-white' : 'text-nexus-text'
        )}
      >
        {course.price === null ? 'Gratis' : formatPrice(course.price)}
      </p>
    </div>
  )
}

export function CourseHero({ course, rating }: CourseHeroProps) {
  return (
    <div>
      {/* Cover image with gradient overlay */}
      <div className="bg-nexus-card relative h-48 w-full overflow-hidden md:h-64">
        {course.coverUrl && (
          <Image
            src={course.coverUrl}
            alt={course.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        {/* Gradient: stronger at bottom where text lives */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Desktop: info over gradient */}
        <div className="absolute right-0 bottom-0 left-0 hidden p-6 md:block">
          <CourseInfo course={course} rating={rating} dark />
        </div>
      </div>

      {/* Mobile: info below image */}
      <div className="p-4 md:hidden">
        <CourseInfo course={course} rating={rating} />
      </div>
    </div>
  )
}
