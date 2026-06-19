'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'
import type { DashboardEnrollment } from './InProgressCourses'

interface DashboardHeroProps {
  firstName: string
  activeEnrollments: number
  completedLessons: number
  overallProgress: number
  firstEnrollment?: DashboardEnrollment
  dayLabel: string
}

export function DashboardHero({
  firstName,
  activeEnrollments,
  completedLessons,
  overallProgress,
  firstEnrollment,
  dayLabel,
}: DashboardHeroProps) {
  const r = 44
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - overallProgress / 100)

  const continueHref = firstEnrollment
    ? `/courses/${firstEnrollment.course?.slug ?? firstEnrollment.courseId}`
    : '/my-courses'

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-7 py-8"
      style={{ background: 'linear-gradient(135deg, #7c6cff 0%, #6d5bf0 60%, #5a4be0 100%)' }}
    >
      {/* Decorative background circles */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-52 w-52 rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-[38%] h-44 w-44 rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-6">
        {/* Left */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[13px] font-medium text-white/65">{dayLabel}</p>
          <h1 className="text-[22px] leading-snug font-extrabold text-white">
            Hola de nuevo, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-sm text-white/75">
            {activeEnrollments} curso{activeEnrollments !== 1 ? 's' : ''} activo
            {activeEnrollments !== 1 ? 's' : ''}
            {' · '}
            {completedLessons} lección{completedLessons !== 1 ? 'es' : ''} esta semana
          </p>
          <Link
            href={continueHref}
            className="mt-5 inline-flex h-9 items-center rounded-xl bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            Continuar aprendiendo
          </Link>
        </div>

        {/* Right — progress ring + streak */}
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="relative h-[110px] w-[110px]">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] leading-none font-extrabold text-white">
                {overallProgress}%
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-white/65">progreso</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span className="text-xs font-semibold text-white">0 días</span>
          </div>
        </div>
      </div>
    </div>
  )
}
