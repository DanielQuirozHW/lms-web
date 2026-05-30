import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import { buttonVariants } from '@/components/ui/button'
import { CourseAnalytics } from '@/components/features/instructor/CourseAnalytics'
import type { CourseDetail, EnrollmentDetail, RatingSummary, StudentGrade } from '@/types/models'
import type { ModuleWithLessons } from '@/hooks/queries/modules'
import type { PaginatedData } from '@/types/api'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  try {
    const r = await api.get<CourseDetail>(`/courses/${courseId}`, { headers })
    return { title: `Analíticas | ${r.data.title} | NexusLMS` }
  } catch {
    return { title: 'Analíticas del curso | NexusLMS' }
  }
}

export default async function CourseAnalyticsPage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Parallel fetches: course, enrollments, ratings, modules
  const [courseResult, enrollmentsResult, ratingsResult, modulesResult] = await Promise.allSettled([
    api.get<CourseDetail>(`/courses/${courseId}`, { headers }),
    api.get<PaginatedData<EnrollmentDetail>>(`/enrollments/course/${courseId}`, {
      params: { limit: 100 },
      headers,
    }),
    api.get<RatingSummary>(`/ratings/course/${courseId}/summary`, { headers }),
    api.get<ModuleWithLessons[]>(`/courses/${courseId}/modules`, { headers }),
  ])

  if (courseResult.status === 'rejected') {
    if (isApiError(courseResult.reason) && courseResult.reason.response?.data.statusCode === 404) {
      notFound()
    }
    throw courseResult.reason
  }

  const course = courseResult.value.data

  // Verify ownership
  const isAdmin = session?.user?.roles?.includes('ADMIN') ?? false
  const isOwner = course.instructorId === session?.user?.id
  if (!isOwner && !isAdmin) notFound()

  const enrollments: EnrollmentDetail[] =
    enrollmentsResult.status === 'fulfilled' ? (enrollmentsResult.value.data.data ?? []) : []

  const ratingSummary: RatingSummary | null =
    ratingsResult.status === 'fulfilled' ? ratingsResult.value.data : null

  const modules: ModuleWithLessons[] =
    modulesResult.status === 'fulfilled' ? (modulesResult.value.data ?? []) : []

  // Fetch per-enrollment student grades (max 20, in parallel)
  const gradeResults = await Promise.allSettled(
    enrollments
      .slice(0, 20)
      .map((e) =>
        api
          .get<StudentGrade>(`/courses/${courseId}/gradebook/student/${e.id}`, { headers })
          .then((r) => r.data)
      )
  )
  const gradebookData: StudentGrade[] = gradeResults
    .filter((r): r is PromiseFulfilledResult<StudentGrade> => r.status === 'fulfilled')
    .map((r) => r.value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/instructor/courses/${courseId}/modules`}
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className:
                'text-nexus-muted hover:text-nexus-text mb-2 -ml-2 flex items-center gap-1',
            })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Módulos
          </Link>
          <h1 className="text-nexus-text text-2xl font-bold">{course.title}</h1>
          <p className="text-nexus-muted mt-1 text-sm">Analíticas del curso</p>
        </div>
      </div>

      <CourseAnalytics
        enrollments={enrollments}
        gradebookData={gradebookData}
        ratingSummary={ratingSummary}
        modules={modules}
      />
    </div>
  )
}
