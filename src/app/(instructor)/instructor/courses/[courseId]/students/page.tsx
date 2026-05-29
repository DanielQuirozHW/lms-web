import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Users } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { CourseDetail } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import type { EnrollmentWithStudent } from '@/hooks/queries/enrollments'
import { buttonVariants } from '@/components/ui/button'
import { StudentList } from '@/components/features/instructor/StudentList'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}
  try {
    const r = await api.get<CourseDetail>(`/courses/${courseId}`, { headers })
    return { title: `Estudiantes | ${r.data.title} | NexusLMS` }
  } catch {
    return { title: 'Estudiantes | NexusLMS' }
  }
}

export default async function CourseStudentsPage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const [courseResult, enrollmentsResult] = await Promise.allSettled([
    api.get<CourseDetail>(`/courses/${courseId}`, { headers }),
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

  const enrollments: EnrollmentWithStudent[] =
    enrollmentsResult.status === 'fulfilled' ? (enrollmentsResult.value.data.data ?? []) : []

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
        <p className="text-nexus-muted mt-1 flex items-center gap-1.5 text-sm">
          <Users className="h-4 w-4" aria-hidden="true" />
          {enrollments.length} estudiante{enrollments.length !== 1 && 's'} inscrito
          {enrollments.length !== 1 && 's'}
        </p>
      </div>

      <StudentList
        courseId={courseId}
        initialEnrollments={enrollments}
        currentUserRoles={session?.user?.roles ?? []}
      />
    </div>
  )
}
