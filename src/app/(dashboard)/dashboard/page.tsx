import type { Metadata } from 'next'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { CalendarEvent } from '@/types/models'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
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

  return (
    <div className="space-y-8">
      {/* Sync notification count to Zustand store for the header badge */}
      <NotificationsSync unreadCount={unreadCount} />

      {/* Page header */}
      <div>
        <h1 className="text-nexus-text text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {activeEnrollments > 0 || completedLessons > 0
            ? `${activeEnrollments} curso${activeEnrollments !== 1 ? 's' : ''} activo${activeEnrollments !== 1 ? 's' : ''} · ${completedLessons} lección${completedLessons !== 1 ? 'es' : ''} completada${completedLessons !== 1 ? 's' : ''}`
            : 'Bienvenido a NexusLMS'}
        </p>
      </div>

      {/* Stat cards */}
      <Suspense fallback={<LoadingSpinner rows={1} />}>
        <StatsCards
          activeEnrollments={activeEnrollments}
          completedLessons={completedLessons}
          upcomingEvents={events.length}
        />
      </Suspense>

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="in-progress-heading">
          <h2 id="in-progress-heading" className="text-nexus-text mb-4 text-base font-semibold">
            En progreso
          </h2>
          <Suspense fallback={<LoadingSpinner rows={3} />}>
            <InProgressCourses enrollments={enrollments} />
          </Suspense>
        </section>

        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="text-nexus-text mb-4 text-base font-semibold">
            Próximos 7 días
          </h2>
          <Suspense fallback={<LoadingSpinner rows={4} />}>
            <UpcomingEvents events={events} />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
