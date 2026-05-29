import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { CourseDetail } from '@/types/models'
import type { ModuleWithLessons } from '@/hooks/queries/modules'
import { buttonVariants } from '@/components/ui/button'
import { ModuleList } from '@/components/features/instructor/ModuleList'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  try {
    const r = await api.get<CourseDetail>(`/courses/${courseId}`, { headers })
    return { title: `Módulos | ${r.data.title} | NexusLMS` }
  } catch {
    return { title: 'Módulos del curso | NexusLMS' }
  }
}

export default async function CourseModulesPage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch course + modules in parallel
  const [courseResult, modulesResult] = await Promise.allSettled([
    api.get<CourseDetail>(`/courses/${courseId}`, { headers }),
    api.get<ModuleWithLessons[]>(`/courses/${courseId}/modules`, { headers }),
  ])

  if (courseResult.status === 'rejected') {
    if (isApiError(courseResult.reason) && courseResult.reason.response?.data.statusCode === 404) {
      notFound()
    }
    throw courseResult.reason
  }

  const course = courseResult.value.data

  // 404 if not owned by this instructor
  const isAdmin = session?.user?.roles?.includes('ADMIN') ?? false
  const isOwner = course.instructorId === session?.user?.id
  if (!isOwner && !isAdmin) notFound()

  const modules: ModuleWithLessons[] =
    modulesResult.status === 'fulfilled' ? modulesResult.value.data : []

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/instructor/courses/${courseId}/edit`}
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className:
                'text-nexus-muted hover:text-nexus-text mb-2 -ml-2 flex items-center gap-1',
            })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Editar curso
          </Link>
          <h1 className="text-nexus-text text-2xl font-bold">{course.title}</h1>
          <p className="text-nexus-muted mt-1 text-sm">
            {modules.length} módulo{modules.length !== 1 && 's'} · {totalLessons} lección
            {totalLessons !== 1 && 'es'}
          </p>
        </div>
      </div>

      {/* Module editor */}
      <ModuleList courseId={courseId} initialModules={modules} />
    </div>
  )
}
