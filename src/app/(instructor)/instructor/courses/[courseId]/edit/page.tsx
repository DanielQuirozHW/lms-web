import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { CourseDetail, Category } from '@/types/models'
import { buttonVariants } from '@/components/ui/button'
import { CourseForm } from '@/components/features/instructor/CourseForm'
import { CourseDangerZone } from '@/components/features/instructor/CourseDangerZone'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  try {
    const r = await api.get<CourseDetail>(`/courses/${courseId}`, { headers })
    return { title: `Editar — ${r.data.title} | NexusLMS` }
  } catch {
    return { title: 'Editar curso | NexusLMS' }
  }
}

export default async function EditCoursePage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch course + categories in parallel
  const [courseResult, categoriesResult] = await Promise.allSettled([
    api.get<CourseDetail>(`/courses/${courseId}`, { headers }),
    api.get<Category[]>('/categories', { headers }),
  ])

  // 404 if course not found
  if (courseResult.status === 'rejected') {
    if (isApiError(courseResult.reason) && courseResult.reason.response?.data.statusCode === 404) {
      notFound()
    }
    throw courseResult.reason
  }

  const course = courseResult.value.data
  const categories: Category[] =
    categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : []

  // 404 if not owned by this instructor (admins can edit any course)
  const isAdmin = session?.user?.roles?.includes('ADMIN') ?? false
  const isOwner = course.instructorId === session?.user?.id
  if (!isOwner && !isAdmin) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Back */}
      <Link
        href="/instructor"
        className={buttonVariants({
          variant: 'ghost',
          size: 'sm',
          className: 'text-nexus-muted hover:text-nexus-text -ml-2 flex items-center gap-1',
        })}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Volver al dashboard
      </Link>

      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Editar curso</h1>
        <p className="text-nexus-muted mt-1 truncate text-sm">{course.title}</p>
      </div>

      <CourseForm mode="edit" initialData={course} categories={categories} />

      <CourseDangerZone
        courseId={course.id}
        courseStatus={course.status}
        courseTitle={course.title}
      />
    </div>
  )
}
