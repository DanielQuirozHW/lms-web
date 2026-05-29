import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { CourseDetail, Gradebook, StudentGrade } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import type { EnrollmentWithStudent } from '@/hooks/queries/enrollments'
import { buttonVariants } from '@/components/ui/button'
import { GradebookSetup } from '@/components/features/instructor/GradebookSetup'
import { GradebookTable } from '@/components/features/instructor/GradebookTable'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}
  try {
    const r = await api.get<CourseDetail>(`/courses/${courseId}`, { headers })
    return { title: `Calificaciones | ${r.data.title} | NexusLMS` }
  } catch {
    return { title: 'Calificaciones | NexusLMS' }
  }
}

export default async function GradebookPage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch course, gradebook, and enrollments in parallel
  const [courseResult, gradebookResult, enrollmentsResult] = await Promise.allSettled([
    api.get<CourseDetail>(`/courses/${courseId}`, { headers }),
    api.get<Gradebook>(`/courses/${courseId}/gradebook`, { headers }),
    api.get<PaginatedData<EnrollmentWithStudent>>(`/enrollments/course/${courseId}`, {
      headers,
    }),
  ])

  if (courseResult.status === 'rejected') {
    if (isApiError(courseResult.reason) && courseResult.reason.response?.data.statusCode === 404) {
      notFound()
    }
    throw courseResult.reason
  }

  const course = courseResult.value.data

  // Ownership check
  const isAdmin = session?.user?.roles?.includes('ADMIN') ?? false
  const isOwner = course.instructorId === session?.user?.id
  if (!isOwner && !isAdmin) notFound()

  const gradebook: Gradebook | null =
    gradebookResult.status === 'fulfilled' ? gradebookResult.value.data : null

  const enrollments: EnrollmentWithStudent[] =
    enrollmentsResult.status === 'fulfilled' ? (enrollmentsResult.value.data.data ?? []) : []

  // Fetch student grades for up to 20 enrollments in parallel
  const gradeSample = enrollments.slice(0, 20)
  const gradeResults = await Promise.allSettled(
    gradeSample.map((e) =>
      api
        .get<StudentGrade>(`/courses/${courseId}/gradebook/student/${e.id}`, { headers })
        .then((r) => r.data)
    )
  )

  const studentGrades: StudentGrade[] = gradeResults
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((g): g is StudentGrade => g !== null)

  const hasCategories = (gradebook?.categories?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/instructor/courses/${courseId}/edit`}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-nexus-muted hover:text-nexus-text mb-2 -ml-2 flex items-center gap-1',
          })}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Editar curso
        </Link>
        <h1 className="text-nexus-text text-2xl font-bold">{course.title}</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          Libro de calificaciones · {enrollments.length} estudiante
          {enrollments.length !== 1 && 's'}
        </p>
      </div>

      {/* Content */}
      {!hasCategories || !gradebook ? (
        <GradebookSetup courseId={courseId} />
      ) : (
        <GradebookTable
          gradebook={gradebook}
          enrollments={enrollments}
          studentGrades={studentGrades}
          courseId={courseId}
        />
      )}
    </div>
  )
}
