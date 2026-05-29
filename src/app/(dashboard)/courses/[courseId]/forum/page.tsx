import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cache } from 'react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { CourseDetail } from '@/types/models'
import type { ForumThreadWithAuthor } from '@/hooks/queries/forum'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { ForumShell } from '@/components/features/forum/ForumShell'

interface PageProps {
  params: Promise<{ courseId: string }>
}

const fetchCourse = cache(
  async (courseId: string, token: string | undefined): Promise<CourseDetail | null> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    try {
      return await api.get<CourseDetail>(`/courses/${courseId}`, { headers }).then((r) => r.data)
    } catch {
      return null
    }
  }
)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const course = await fetchCourse(courseId, session?.accessToken)
  const courseName = course?.title ?? 'Curso'
  return { title: `Foro | ${courseName} | NexusLMS` }
}

export default async function ForumPage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Parallel: threads + course info
  const [threadsResult] = await Promise.allSettled([
    api.get<PaginatedData<ForumThreadWithAuthor>>('/forum/threads', {
      params: { courseId },
      headers,
    }),
  ])

  const threads: ForumThreadWithAuthor[] =
    threadsResult.status === 'fulfilled' ? (threadsResult.value.data.data ?? []) : []

  const currentUserId = session?.user?.id ?? ''
  const currentUserRoles = session?.user?.roles ?? []

  return (
    // ForumShell uses useSearchParams → must be in Suspense
    <Suspense fallback={<LoadingSpinner rows={4} />}>
      <ForumShell
        courseId={courseId}
        initialThreads={threads}
        currentUserId={currentUserId}
        currentUserRoles={currentUserRoles}
      />
    </Suspense>
  )
}
