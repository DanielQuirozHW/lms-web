'use client'

import Link from 'next/link'
import { Flame, ArrowRight } from 'lucide-react'
import {
  useOverallProgressStats,
  useStreakStats,
  useLastActiveLessonStats,
} from '@/hooks/queries/users'

interface DashboardHeroProps {
  firstName: string
  activeEnrollments: number
  completedLessons: number
  dayLabel: string
}

export function DashboardHero({
  firstName,
  activeEnrollments,
  completedLessons,
  dayLabel,
}: DashboardHeroProps) {
  const { data: progressData } = useOverallProgressStats()
  const { data: streakData } = useStreakStats()
  const { data: lastLesson } = useLastActiveLessonStats()

  const overallProgress = progressData?.percentage ?? 0
  const streakDays = streakData?.currentStreak ?? 0
  const continueHref = lastLesson
    ? `/courses/${lastLesson.courseSlug}/learn/${lastLesson.lessonId}`
    : '/my-courses'

  const r = 60.5
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - overallProgress / 100)

  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-8 py-[30px]"
      style={{
        background: 'linear-gradient(125deg, #6d5bf0 0%, #8b5bf0 55%, #b05be0 100%)',
        boxShadow: 'rgba(109, 91, 240, 0.6) 0px 22px 44px -22px',
      }}
    >
      {/* Decorative circle 1 — upper-center */}
      <div
        className="pointer-events-none absolute h-[240px] w-[240px] rounded-full bg-white/[.08]"
        style={{ right: '200px', top: '-60px' }}
        aria-hidden="true"
      />
      {/* Decorative circle 2 — lower-right */}
      <div
        className="pointer-events-none absolute h-[220px] w-[220px] rounded-full bg-white/[.07]"
        style={{ right: '-40px', bottom: '-90px' }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-6">
        {/* Left — text + CTA */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[13px] font-semibold tracking-[0.04em] text-white/85 uppercase">
            {dayLabel}
          </p>
          <h1 className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.025em] text-white">
            Hola de nuevo, {firstName} 👋
          </h1>
          <p className="mt-[10px] mb-[18px] max-w-[440px] text-[15px] text-white/90">
            {activeEnrollments} curso{activeEnrollments !== 1 ? 's' : ''} activo
            {activeEnrollments !== 1 ? 's' : ''}
            {' · '}
            {completedLessons} lección{completedLessons !== 1 ? 'es' : ''} esta semana
          </p>
          <Link
            href={continueHref}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14.5px] font-bold text-[#6d5bf0] transition-opacity hover:opacity-90"
          >
            Continuar aprendiendo
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Link>
        </div>

        {/* Right — progress ring + streak */}
        <div className="flex shrink-0 flex-col items-center gap-[10px]">
          <div className="relative h-[132px] w-[132px]">
            <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="66"
                cy="66"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="11"
              />
              <circle
                cx="66"
                cy="66"
                r={r}
                fill="none"
                stroke="white"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[30px] leading-none font-extrabold text-white">
                {overallProgress}%
              </span>
              <span className="mt-[3px] text-[12px] text-white/85">progreso</span>
            </div>
          </div>

          <div className="flex items-center gap-[6px] rounded-full bg-white/[.16] px-3 py-[6px]">
            <Flame className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-white">
              {streakDays} día{streakDays !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
