'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { CourseCard, type CatalogCourse } from './CourseCard'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/types/api'

interface CourseGridProps {
  courses: CatalogCourse[]
  meta: PaginationMeta
  // Passed from the server component so pagination preserves active filters
  categoryId?: string
  search?: string
}

export function CourseGrid({ courses, meta, categoryId, search }: CourseGridProps) {
  const router = useRouter()

  function goToPage(page: number) {
    const params = new URLSearchParams()
    if (categoryId) params.set('categoryId', categoryId)
    if (search) params.set('search', search)
    params.set('page', String(page))
    router.push(`/courses?${params.toString()}`)
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No se encontraron cursos"
        description="Probá con otra búsqueda o categoría"
        className="border-nexus-border"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(meta.page - 1)}
            disabled={meta.page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <span className="text-nexus-muted text-sm">
            Página <span className="text-nexus-text font-semibold">{meta.page}</span> de{' '}
            <span className="text-nexus-text font-semibold">{meta.totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
