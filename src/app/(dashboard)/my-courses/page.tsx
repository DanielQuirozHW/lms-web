import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { EnrollmentDetail, EnrollmentStatus, Enrollment } from '@/types/models'
import type { CatalogCourse } from '@/components/features/courses/CourseCard'
import { buttonVariants } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { MyCoursesFilter } from '@/components/features/courses/MyCoursesFilter'
import { MyCourseCard } from '@/components/features/courses/MyCourseCard'

export const metadata: Metadata = {
  title: 'Mis cursos | NexusLMS',
  description: 'Tus cursos inscritos, progreso y calificaciones en NexusLMS.',
  openGraph: {
    title: 'Mis cursos | NexusLMS',
    description: 'Tus cursos inscritos, progreso y calificaciones en NexusLMS.',
    type: 'website',
  },
}

const LIMIT = 9

const VALID_STATUSES: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED']

const emptyMessages: Record<string, { title: string; description: string }> = {
  '': {
    title: 'No tenés cursos inscritos',
    description: 'Explorá el catálogo y comenzá a aprender',
  },
  ACTIVE: {
    title: 'No tenés cursos en progreso',
    description: 'Inscribite en un curso para comenzar',
  },
  COMPLETED: {
    title: 'No tenés cursos completados',
    description: '¡Terminá un curso para verlo acá!',
  },
  CANCELLED: {
    title: 'No tenés cursos cancelados',
    description: 'Todo en orden por acá',
  },
}

interface EnrolledCourseItem {
  enrollment: EnrollmentDetail
  course: CatalogCourse
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function MyCoursesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = VALID_STATUSES.includes(params.status as EnrollmentStatus)
    ? (params.status as EnrollmentStatus)
    : undefined
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // 5 parallel requests: 4 lightweight count queries + main paginated enrollments
  const [allRes, activeRes, completedRes, cancelledRes, enrollmentsRes] = await Promise.allSettled([
    api.get<PaginatedData<Enrollment>>('/enrollments', {
      params: { limit: 1 },
      headers,
    }),
    api.get<PaginatedData<Enrollment>>('/enrollments', {
      params: { limit: 1, status: 'ACTIVE' },
      headers,
    }),
    api.get<PaginatedData<Enrollment>>('/enrollments', {
      params: { limit: 1, status: 'COMPLETED' },
      headers,
    }),
    api.get<PaginatedData<Enrollment>>('/enrollments', {
      params: { limit: 1, status: 'CANCELLED' },
      headers,
    }),
    api.get<PaginatedData<EnrollmentDetail>>('/enrollments', {
      params: { page, limit: LIMIT, ...(status && { status }) },
      headers,
    }),
  ])

  const counts = {
    all: allRes.status === 'fulfilled' ? allRes.value.data.meta.total : 0,
    active: activeRes.status === 'fulfilled' ? activeRes.value.data.meta.total : 0,
    completed: completedRes.status === 'fulfilled' ? completedRes.value.data.meta.total : 0,
    cancelled: cancelledRes.status === 'fulfilled' ? cancelledRes.value.data.meta.total : 0,
  }

  const enrollmentsData = enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value.data : null
  const enrollments: EnrollmentDetail[] = enrollmentsData?.data ?? []
  const meta = enrollmentsData?.meta ?? {
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  }

  // Fetch course detail for every enrollment on the page in parallel
  const courseResults = await Promise.allSettled(
    enrollments.map((enrollment) =>
      api.get<CatalogCourse>(`/courses/${enrollment.courseId}`, { headers }).then((r) => r.data)
    )
  )

  const items: EnrolledCourseItem[] = enrollments
    .map((enrollment, i) => {
      const result = courseResults[i]
      if (!result || result.status !== 'fulfilled') return null
      return { enrollment, course: result.value }
    })
    .filter((item): item is EnrolledCourseItem => item !== null)

  // Pagination link helpers
  const baseParams = new URLSearchParams()
  if (status) baseParams.set('status', status)

  const prevParams = new URLSearchParams(baseParams)
  prevParams.set('page', String(page - 1))

  const nextParams = new URLSearchParams(baseParams)
  nextParams.set('page', String(page + 1))

  const empty = emptyMessages[status ?? ''] ?? emptyMessages['']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Mis cursos</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {meta.total} curso{meta.total !== 1 && 's'} inscrito{meta.total !== 1 && 's'}
        </p>
      </div>

      {/* Filter tabs — uses useSearchParams, needs Suspense */}
      <Suspense fallback={<LoadingSpinner rows={1} />}>
        <MyCoursesFilter counts={counts} />
      </Suspense>

      {/* Course grid or empty state */}
      <Suspense fallback={<LoadingSpinner rows={3} />}>
        {items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={empty.title}
            description={empty.description}
            className="border-nexus-border"
            {...(!status && {
              action: {
                label: 'Explorar cursos',
                onClick: undefined as unknown as () => void,
              },
            })}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map(({ enrollment, course }) => (
              <MyCourseCard key={enrollment.id} enrollment={enrollment} course={course} />
            ))}
          </div>
        )}
      </Suspense>

      {/* Server-rendered pagination — no client JS required */}
      {meta.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginación">
          {page > 1 ? (
            <Link
              href={`/my-courses?${prevParams.toString()}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'pointer-events-none opacity-50',
              })}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </span>
          )}

          <span className="text-nexus-muted text-sm">
            Página <span className="text-nexus-text font-semibold">{page}</span> de{' '}
            <span className="text-nexus-text font-semibold">{meta.totalPages}</span>
          </span>

          {page < meta.totalPages ? (
            <Link
              href={`/my-courses?${nextParams.toString()}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'pointer-events-none opacity-50',
              })}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
