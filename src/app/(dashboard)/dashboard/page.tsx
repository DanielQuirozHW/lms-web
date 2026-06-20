import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { CalendarEvent } from '@/types/models'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { DashboardHero } from '@/components/features/dashboard/DashboardHero'
import { WeeklyActivity } from '@/components/features/dashboard/WeeklyActivity'
import { StatsCards } from '@/components/features/dashboard/StatsCards'
import {
  InProgressCourses,
  type DashboardEnrollment,
} from '@/components/features/dashboard/InProgressCourses'
import { UpcomingEvents } from '@/components/features/dashboard/UpcomingEvents'
import { NotificationsSync } from '@/components/features/dashboard/NotificationsSync'

export const metadata: Metadata = {
  title: 'Dashboard | NexusLMS',
  description: 'Tu resumen de cursos, progreso y eventos próximos en NexusLMS.',
  openGraph: {
    title: 'Dashboard | NexusLMS',
    description: 'Tu resumen de cursos, progreso y eventos próximos en NexusLMS.',
    type: 'website',
  },
}

export default async function DashboardPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  const todayDate = new Date()
  const today = todayDate.toISOString().split('T')[0]
  const nextWeekDate = new Date(todayDate)
  nextWeekDate.setDate(todayDate.getDate() + 7)
  const in7Days = nextWeekDate.toISOString().split('T')[0]

  // Parallel data fetch — allSettled so one failed endpoint doesn't blank the page
  const [enrollmentsResult, countResult, eventsResult] = await Promise.allSettled([
    api.get<PaginatedData<DashboardEnrollment>>('/enrollments', {
      params: { status: 'ACTIVE', limit: 4 },
      headers,
    }),
    api.get<{ count: number }>('/notifications/unread-count', { headers }),
    api.get<PaginatedData<CalendarEvent>>('/calendar', {
      params: { startDate: today, endDate: in7Days },
      headers,
    }),
  ])

  const enrollments: DashboardEnrollment[] =
    enrollmentsResult.status === 'fulfilled' ? (enrollmentsResult.value.data.data ?? []) : []

  const unreadCount: number =
    countResult.status === 'fulfilled' ? (countResult.value.data.count ?? 0) : 0

  const events: CalendarEvent[] =
    eventsResult.status === 'fulfilled' ? (eventsResult.value.data.data ?? []) : []

  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE').length
  const completedLessons = enrollments.reduce(
    (sum, e) => sum + (e.progress?.completedLessons ?? 0),
    0
  )
  const firstName = session?.user?.firstName ?? session?.user?.name?.split(' ')[0] ?? 'Usuario'

  const rawDayLabel = todayDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const dayLabel = rawDayLabel.charAt(0).toUpperCase() + rawDayLabel.slice(1)

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Sync notification count to Zustand store for the header badge */}
      <NotificationsSync unreadCount={unreadCount} />

      {/* Hero banner */}
      <DashboardHero
        firstName={firstName}
        activeEnrollments={activeEnrollments}
        completedLessons={completedLessons}
        dayLabel={dayLabel}
      />

      {/* Stat cards */}
      <StatsCards
        activeEnrollments={activeEnrollments}
        completedLessons={completedLessons}
        upcomingEvents={events.length}
      />

      {/* Two-column main section: 1.55fr / 1fr */}
      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1.55fr_1fr]">
        {/* Left — In Progress */}
        <div className="flex flex-col gap-[14px]">
          <div className="flex items-center justify-between">
            <h2 className="text-nexus-text text-lg font-extrabold tracking-[-0.01em]">
              En progreso
            </h2>
            <Link href="/my-courses" className="text-nexus-accent text-[13px] font-bold">
              Ver todos
            </Link>
          </div>
          <Suspense fallback={<LoadingSpinner rows={3} />}>
            <InProgressCourses enrollments={enrollments} />
          </Suspense>
        </div>

        {/* Right — Weekly Activity + Upcoming Events */}
        <div className="flex flex-col gap-[22px]">
          <WeeklyActivity />

          <div
            className="border-nexus-border bg-nexus-card rounded-[18px] border p-5"
            style={{ boxShadow: 'var(--nexus-card-shadow)' }}
          >
            <h3 className="text-nexus-text mb-4 text-base font-extrabold">Próximos 7 días</h3>
            <Suspense fallback={<LoadingSpinner rows={4} />}>
              <UpcomingEvents events={events} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
