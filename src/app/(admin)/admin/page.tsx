import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import { AdminMetricsCards } from '@/components/features/admin/AdminMetricsCards'
import { RecentUsersTable } from '@/components/features/admin/RecentUsersTable'
import { RecentCoursesTable } from '@/components/features/admin/RecentCoursesTable'
import type { User, GlobalAnnouncement } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import type { CatalogCourse } from '@/types/models'

export const metadata: Metadata = {
  title: 'Panel de administración | NexusLMS',
  description: 'Métricas globales y resumen de la plataforma NexusLMS.',
  openGraph: {
    title: 'Panel de administración | NexusLMS',
    description: 'Métricas globales y resumen de la plataforma NexusLMS.',
    type: 'website',
  },
}

export default async function AdminDashboardPage() {
  const session = await auth()
  const adminName = session?.user?.firstName ?? 'Admin'
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  const [usersResult, coursesResult, publishedResult, draftResult, archivedResult, alertsResult] =
    await Promise.allSettled([
      api.get<PaginatedData<User>>('/users', {
        params: { page: 1, limit: 10 },
        headers,
      }),
      api.get<PaginatedData<CatalogCourse>>('/courses', {
        params: { page: 1, limit: 10 },
        headers,
      }),
      api.get<PaginatedData<CatalogCourse>>('/courses', {
        params: { page: 1, limit: 1, status: 'PUBLISHED' },
        headers,
      }),
      api.get<PaginatedData<CatalogCourse>>('/courses', {
        params: { page: 1, limit: 1, status: 'DRAFT' },
        headers,
      }),
      api.get<PaginatedData<CatalogCourse>>('/courses', {
        params: { page: 1, limit: 1, status: 'ARCHIVED' },
        headers,
      }),
      api.get<GlobalAnnouncement[]>('/announcements/global', { headers }),
    ])

  const totalUsers =
    usersResult.status === 'fulfilled' ? (usersResult.value.data.meta.total ?? 0) : 0
  const recentUsers: User[] =
    usersResult.status === 'fulfilled' ? (usersResult.value.data.data ?? []) : []

  const totalCourses =
    coursesResult.status === 'fulfilled' ? (coursesResult.value.data.meta.total ?? 0) : 0
  const recentCourses: CatalogCourse[] =
    coursesResult.status === 'fulfilled' ? (coursesResult.value.data.data ?? []) : []

  const publishedCourses =
    publishedResult.status === 'fulfilled' ? (publishedResult.value.data.meta.total ?? 0) : 0

  const draftCourses =
    draftResult.status === 'fulfilled' ? (draftResult.value.data.meta.total ?? 0) : 0

  const archivedCourses =
    archivedResult.status === 'fulfilled' ? (archivedResult.value.data.meta.total ?? 0) : 0

  const allAlerts: GlobalAnnouncement[] =
    alertsResult.status === 'fulfilled' ? (alertsResult.value.data ?? []) : []
  const activeAlerts = allAlerts.filter((a) => a.isActive).length

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Bienvenido, {adminName}</h1>
        <p className="text-nexus-muted mt-1 text-sm">Resumen de la plataforma NexusLMS</p>
      </div>

      {/* Metrics */}
      <AdminMetricsCards
        totalUsers={totalUsers}
        totalCourses={totalCourses}
        publishedCourses={publishedCourses}
        draftCourses={draftCourses}
        archivedCourses={archivedCourses}
        activeAlerts={activeAlerts}
      />

      {/* Recent activity — two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentUsersTable users={recentUsers} />
        <RecentCoursesTable courses={recentCourses} />
      </div>
    </div>
  )
}
