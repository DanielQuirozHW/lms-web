import { Star, BookOpen, Users, Clock, Award } from 'lucide-react'
import type { CourseDetail, CourseLevel, RatingSummary } from '@/types/models'
import { formatDuration, formatPrice } from '@/lib/utils'
import { isMarketplace } from '@/lib/config'

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

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

function StarRow({ summary }: { summary: RatingSummary }) {
  const score5 =
    summary.scale === 'STARS_5'
      ? summary.averageScore
      : summary.scale === 'NUMERIC_10'
        ? summary.averageScore / 2
        : summary.averageScore / 20
  const filled = Math.round(score5)

  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= filled ? 'fill-amber-400 text-amber-400' : 'fill-white/20 text-white/20'}`}
          />
        ))}
      </span>
      <span className="text-[15px] leading-none font-extrabold">
        {summary.averageScore.toFixed(1)}
      </span>
      <span className="text-[13.5px] opacity-80">({summary.totalRatings} reseñas)</span>
    </span>
  )
}

export function CourseHero({ course, rating }: CourseHeroProps) {
  const isFree = course.enrollmentType === 'FREE' || course.price === null || course.price === 0
  const showPriceRow = rating != null || isMarketplace

  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-8 py-8 text-white md:px-[34px]"
      style={{
        background: 'linear-gradient(125deg,#6D5BF0 0%,#8B5BF0 55%,#B05BE0 100%)',
        boxShadow: 'rgba(109,91,240,.6) 0px 22px 44px -22px',
      }}
    >
      {/* Decorative circles */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 170,
          top: -70,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.07)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -50,
          bottom: -110,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.06)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div className="relative max-w-2xl">
        {/* Category + level row */}
        {(course.category || course.level) && (
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            {course.category && (
              <span
                className="rounded-full px-[11px] py-[5px] text-[12px] font-bold tracking-[.1em] uppercase"
                style={{ background: 'rgba(255,255,255,.18)' }}
              >
                {course.category.name}
              </span>
            )}
            {course.level && (
              <span className="text-[12px] font-semibold tracking-[.08em] uppercase opacity-85">
                Nivel {LEVEL_LABELS[course.level]}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h1
          className="mb-3.5 leading-[1.05] font-extrabold tracking-[-0.03em]"
          style={{ fontSize: 'clamp(24px, 4vw, 38px)' }}
        >
          {course.title}
        </h1>

        {/* Rating + price row */}
        {showPriceRow && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {rating && <StarRow summary={rating} />}
            {rating && isMarketplace && (
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: 'rgba(255,255,255,.5)' }}
                aria-hidden="true"
              />
            )}
            {isMarketplace &&
              (isFree ? (
                <span
                  className="rounded-full bg-white px-3 py-[5px] text-[13px] font-extrabold tracking-[.04em] uppercase"
                  style={{ color: '#0E9F6E' }}
                >
                  Gratis
                </span>
              ) : (
                <span className="text-base font-extrabold">{formatPrice(course.price ?? 0)}</span>
              ))}
          </div>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2.5">
          {course.lessonsCount > 0 && (
            <span
              className="flex items-center gap-[7px] rounded-full px-[13px] py-[7px] text-[13.5px] font-semibold"
              style={{ background: 'rgba(255,255,255,.16)' }}
            >
              <BookOpen className="h-[15px] w-[15px]" aria-hidden="true" />
              {course.lessonsCount} lecciones
            </span>
          )}
          {course.enrollmentsCount > 0 && (
            <span
              className="flex items-center gap-[7px] rounded-full px-[13px] py-[7px] text-[13.5px] font-semibold"
              style={{ background: 'rgba(255,255,255,.16)' }}
            >
              <Users className="h-[15px] w-[15px]" aria-hidden="true" />
              {course.enrollmentsCount} estudiantes
            </span>
          )}
          {course.totalDuration > 0 && (
            <span
              className="flex items-center gap-[7px] rounded-full px-[13px] py-[7px] text-[13.5px] font-semibold"
              style={{ background: 'rgba(255,255,255,.16)' }}
            >
              <Clock className="h-[15px] w-[15px]" aria-hidden="true" />
              {formatDuration(course.totalDuration)}
            </span>
          )}
          <span
            className="flex items-center gap-[7px] rounded-full px-[13px] py-[7px] text-[13.5px] font-semibold"
            style={{ background: 'rgba(255,255,255,.16)' }}
          >
            <Award className="h-[15px] w-[15px]" aria-hidden="true" />
            Certificado
          </span>
        </div>
      </div>
    </div>
  )
}
