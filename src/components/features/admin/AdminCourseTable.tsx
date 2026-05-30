'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Pencil, Globe, Archive, BookOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import api from '@/lib/api'
import { courseKeys } from '@/hooks/queries/courses'
import type { CatalogCourse } from '@/types/models'
import type { CourseStatus } from '@/types/models'
import type { PaginationMeta } from '@/types/api'

const statusConfig: Record<CourseStatus, { label: string; className: string }> = {
  PUBLISHED: { label: 'Publicado', className: 'bg-nexus-success/15 text-nexus-success' },
  DRAFT: { label: 'Borrador', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  ARCHIVED: { label: 'Archivado', className: 'bg-nexus-muted/10 text-nexus-muted' },
}

const STATUS_TABS: { label: string; value: CourseStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Publicados', value: 'PUBLISHED' },
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'Archivados', value: 'ARCHIVED' },
]

interface AdminCourse extends CatalogCourse {
  lessonsCount?: number
  enrollmentsCount?: number
}

interface AdminCourseTableProps {
  courses: AdminCourse[]
  meta: PaginationMeta
  currentPage: number
  currentStatus: CourseStatus | ''
}

export function AdminCourseTable({
  courses,
  meta,
  currentPage,
  currentStatus,
}: AdminCourseTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null)

  // Generic publish/archive mutations — courseId passed as arg
  const { mutate: publishCourse } = useMutation({
    mutationFn: (courseId: string) => api.patch(`/courses/${courseId}/publish`),
    onSuccess: () => {
      toast.success('Curso publicado')
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      setPendingCourseId(null)
      router.refresh()
    },
    onError: () => {
      toast.error('No se pudo publicar el curso')
      setPendingCourseId(null)
    },
  })

  const { mutate: archiveCourse } = useMutation({
    mutationFn: (courseId: string) => api.patch(`/courses/${courseId}/archive`),
    onSuccess: () => {
      toast.success('Curso archivado')
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      setPendingCourseId(null)
      router.refresh()
    },
    onError: () => {
      toast.error('No se pudo archivar el curso')
      setPendingCourseId(null)
    },
  })

  // Client-side search filter
  const filtered = courses.filter((c) => {
    if (!search) return true
    return c.title.toLowerCase().includes(search.toLowerCase())
  })

  // Pagination URL builder (preserves status filter)
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (currentStatus) params.set('status', currentStatus)
    return `/admin/courses?${params.toString()}`
  }

  function statusUrl(s: CourseStatus | '') {
    const params = new URLSearchParams()
    if (s) params.set('status', s)
    params.set('page', '1')
    return s ? `/admin/courses?${params.toString()}` : '/admin/courses'
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div
        role="tablist"
        aria-label="Filtrar por estado"
        className="border-nexus-border flex gap-0 overflow-x-auto border-b"
      >
        {STATUS_TABS.map(({ label, value }) => (
          <Link
            key={value}
            href={statusUrl(value)}
            role="tab"
            aria-selected={currentStatus === value}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              currentStatus === value
                ? 'border-nexus-accent text-nexus-accent'
                : 'text-nexus-muted hover:text-nexus-text border-transparent'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search
          className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          aria-label="Buscar curso"
          className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus:border-nexus-accent focus:ring-nexus-accent/30 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-nexus-text text-sm font-medium">Sin cursos para mostrar</p>
        </div>
      ) : (
        <div className="border-nexus-border overflow-x-auto rounded-xl border">
          <table className="w-full text-sm" aria-label="Lista de cursos">
            <thead>
              <tr className="border-nexus-border bg-nexus-card border-b">
                {['Curso', 'Instructor', 'Categoría', 'Estado', 'Precio', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-nexus-border divide-y">
              {filtered.map((course) => {
                const { label, className } = statusConfig[course.status]
                const instructorName = course.instructor
                  ? `${course.instructor.firstName} ${course.instructor.lastName}`.trim()
                  : '—'
                const isActionPending = pendingCourseId === course.id

                return (
                  <tr
                    key={course.id}
                    className="bg-nexus-card hover:bg-nexus-accent-muted/20 transition-colors"
                  >
                    {/* Cover + title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-nexus-bg relative h-8 w-14 shrink-0 overflow-hidden rounded">
                          {course.coverUrl ? (
                            <Image
                              src={course.coverUrl}
                              alt={course.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <BookOpen
                                className="text-nexus-muted/40 h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-nexus-text max-w-[200px] truncate font-medium">
                          {course.title}
                        </span>
                      </div>
                    </td>
                    <td className="text-nexus-muted px-4 py-3">{instructorName}</td>
                    <td className="text-nexus-muted px-4 py-3">{course.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                          className
                        )}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="text-nexus-text px-4 py-3">
                      {course.price === null ? (
                        <span className="text-nexus-success text-xs font-semibold">Gratis</span>
                      ) : (
                        formatPrice(course.price)
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/instructor/courses/${course.id}/edit`}
                          className={buttonVariants({
                            variant: 'ghost',
                            size: 'sm',
                            className: 'text-nexus-muted hover:text-nexus-text h-7 px-2',
                          })}
                          aria-label={`Editar ${course.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>

                        {course.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPendingCourseId(course.id)
                              publishCourse(course.id)
                            }}
                            disabled={isActionPending}
                            className="text-nexus-muted hover:text-nexus-success h-7 px-2"
                            aria-label="Publicar curso"
                          >
                            {isActionPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        )}

                        {course.status === 'PUBLISHED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPendingCourseId(course.id)
                              archiveCourse(course.id)
                            }}
                            disabled={isActionPending}
                            className="text-nexus-muted hover:text-nexus-muted h-7 px-2"
                            aria-label="Archivar curso"
                          >
                            {isActionPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginación">
          {currentPage > 1 ? (
            <Link
              href={pageUrl(currentPage - 1)}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label="Página anterior"
            >
              ←
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
              ←
            </span>
          )}
          <span className="text-nexus-muted text-sm">
            Página <span className="text-nexus-text font-semibold">{currentPage}</span> de{' '}
            <span className="text-nexus-text font-semibold">{meta.totalPages}</span>
          </span>
          {currentPage < meta.totalPages ? (
            <Link
              href={pageUrl(currentPage + 1)}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label="Página siguiente"
            >
              →
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
              →
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
