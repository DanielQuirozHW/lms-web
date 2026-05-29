import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, PlusCircle, BookOpen } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData, PaginationMeta } from '@/types/api'
import type { CourseDetail, Enrollment } from '@/types/models'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { InstructorStatsCards } from '@/components/features/instructor/InstructorStatsCards'
import { InstructorCourseCard } from '@/components/features/instructor/InstructorCourseCard'

export const metadata: Metadata = { title: 'Dashboard instructor | NexusLMS' }

const LIMIT = 9

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function InstructorDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch instructor's courses (paginated)
  const coursesResult = await api
    .get<PaginatedData<CourseDetail>>('/courses/my', { params: { page, limit: LIMIT }, headers })
    .catch(() => null)

  const courses: CourseDetail[] = coursesResult?.data.data ?? []
  const meta: PaginationMeta = coursesResult?.data.meta ?? {
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  }

  // Compute status stats from current page (full counts from meta.total)
  const totalCourses = meta.total
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length

  // Total students: fetch enrollment count for each published course on this page (max 5)
  const publishedSample = courses.filter((c) => c.status === 'PUBLISHED').slice(0, 5)
  const enrollmentResults = await Promise.allSettled(
    publishedSample.map((course) =>
      api.get<PaginatedData<Enrollment>>(`/enrollments/course/${course.id}`, {
        params: { limit: 1 },
        headers,
      })
    )
  )

  const totalStudents = enrollmentResults.reduce((sum, result, i) => {
    if (result.status === 'fulfilled') {
      return sum + (result.value.data.meta?.total ?? 0)
    }
    // Fall back to embedded count if API call failed
    return sum + (publishedSample[i]?.enrollmentsCount ?? 0)
  }, 0)

  // Pagination URLs
  const prevParams = new URLSearchParams()
  prevParams.set('page', String(page - 1))
  const nextParams = new URLSearchParams()
  nextParams.set('page', String(page + 1))

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Dashboard instructor</h1>
        <p className="text-nexus-muted mt-1 text-sm">Resumen de tus cursos y actividad</p>
      </div>

      {/* Stats */}
      <InstructorStatsCards
        totalCourses={totalCourses}
        totalStudents={totalStudents}
        publishedCourses={publishedCourses}
        draftCourses={draftCourses}
      />

      {/* Courses section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-nexus-text text-lg font-semibold">Mis cursos</h2>
          <Link
            href="/instructor/courses/new"
            className={buttonVariants({
              className:
                'bg-nexus-accent hover:bg-nexus-accent-hover flex items-center gap-1.5 text-white',
            })}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Crear curso
          </Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Todavía no creaste ningún curso"
            description="Creá tu primer curso y empezá a enseñar"
            className="border-nexus-border"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <InstructorCourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Server-rendered pagination */}
            {meta.totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Paginación">
                {page > 1 ? (
                  <Link
                    href={`/instructor?${prevParams.toString()}`}
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
                    href={`/instructor?${nextParams.toString()}`}
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
          </>
        )}
      </section>
    </div>
  )
}
