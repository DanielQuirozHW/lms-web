import type { Metadata } from 'next'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Category } from '@/types/models'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { CoursesFilter } from '@/components/features/courses/CoursesFilter'
import { CourseGrid } from '@/components/features/courses/CourseGrid'
import type { CatalogCourse } from '@/types/models'

export const metadata: Metadata = {
  title: 'Explorar cursos | NexusLMS',
  description: 'Explorá el catálogo completo de cursos disponibles en NexusLMS.',
  openGraph: {
    title: 'Explorar cursos | NexusLMS',
    description: 'Explorá el catálogo completo de cursos disponibles en NexusLMS.',
    type: 'website',
  },
}

interface PageProps {
  searchParams: Promise<{
    categoryId?: string
    page?: string
    search?: string
    enrollmentType?: string
  }>
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const categoryId = params.categoryId
  const search = params.search
  const enrollmentType = params.enrollmentType
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  const [coursesResult, categoriesResult] = await Promise.allSettled([
    api.get<PaginatedData<CatalogCourse>>('/courses', {
      params: {
        page,
        limit: 12,
        ...(categoryId && { categoryId }),
        ...(search && { search }),
        ...(enrollmentType && { enrollmentType }),
      },
      headers,
    }),
    api.get<Category[]>('/categories', { headers }),
  ])

  const coursesData = coursesResult.status === 'fulfilled' ? coursesResult.value.data : null
  const courses: CatalogCourse[] = coursesData?.data ?? []
  const meta = coursesData?.meta ?? { total: 0, page: 1, limit: 12, totalPages: 1 }

  const categories: Category[] =
    categoriesResult.status === 'fulfilled' ? (categoriesResult.value.data as Category[]) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Explorar cursos</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {meta.total} {meta.total === 1 ? 'curso disponible' : 'cursos disponibles'}
        </p>
      </div>

      {/* CoursesFilter uses useSearchParams — must be inside Suspense */}
      <Suspense fallback={<LoadingSpinner rows={1} />}>
        <CoursesFilter categories={categories} />
      </Suspense>

      <Suspense fallback={<LoadingSpinner rows={3} />}>
        <CourseGrid courses={courses} meta={meta} categoryId={categoryId} search={search} />
      </Suspense>
    </div>
  )
}
