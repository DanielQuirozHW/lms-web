import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData, PaginationMeta } from '@/types/api'
import type { CourseStatus } from '@/types/models'
import type { CatalogCourse } from '@/components/features/courses/CourseCard'
import { AdminCourseTable } from '@/components/features/admin/AdminCourseTable'

export const metadata: Metadata = { title: 'Cursos | NexusLMS' }

const LIMIT = 20

interface AdminCourse extends CatalogCourse {
  lessonsCount?: number
  enrollmentsCount?: number
}

const VALID_STATUSES: CourseStatus[] = ['PUBLISHED', 'DRAFT', 'ARCHIVED']

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminCoursesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const status = VALID_STATUSES.includes(params.status as CourseStatus)
    ? (params.status as CourseStatus)
    : ('' as const)

  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let courses: AdminCourse[] = []
  let meta: PaginationMeta = { total: 0, page: 1, limit: LIMIT, totalPages: 1 }

  try {
    const r = await api.get<PaginatedData<AdminCourse>>('/courses', {
      params: {
        page,
        limit: LIMIT,
        ...(status && { status }),
      },
      headers,
    })
    courses = r.data.data ?? []
    meta = r.data.meta
  } catch {
    // Render empty state on error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Cursos</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {meta.total} curso{meta.total !== 1 && 's'} en la plataforma
        </p>
      </div>

      <AdminCourseTable courses={courses} meta={meta} currentPage={page} currentStatus={status} />
    </div>
  )
}
