'use client'

import { useState, useRef } from 'react'
import { Search, BookPlus, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { CatalogCourse } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { courseKeys } from '@/hooks/queries/courses'
import { enrollmentKeys } from '@/hooks/queries/enrollments'

interface AssignCoursesModalProps {
  userId: string
  enrolledCourseIds: string[]
}

export function AssignCoursesModal({ userId, enrolledCourseIds }: AssignCoursesModalProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: courseKeys.list({ search: debouncedSearch, limit: 20 }),
    queryFn: () =>
      api
        .get<PaginatedData<CatalogCourse>>('/courses', {
          params: { search: debouncedSearch, limit: 20 },
        })
        .then((r) => r.data),
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  })

  const courses = data?.data ?? []

  // Enroll one user to each selected course (bulk endpoint: { userIds, courseId })
  const { mutateAsync: bulkEnroll } = useMutation({
    mutationFn: (courseId: string) =>
      api.post('/enrollments/bulk', { userIds: [userId], courseId }).then((r) => r.data),
  })

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  function toggleCourse(courseId: string) {
    if (enrolledCourseIds.includes(courseId)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  function handleClose() {
    setOpen(false)
    setSearch('')
    setDebouncedSearch('')
    setSelected(new Set())
  }

  const [isPending, setIsPending] = useState(false)

  async function handleAssign() {
    setIsPending(true)
    try {
      await Promise.all(Array.from(selected).map((courseId) => bulkEnroll(courseId)))
      const count = selected.size
      toast.success(`${count} curso${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}`)
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.userList(userId) })
      handleClose()
    } catch {
      toast.error('No se pudo completar la asignación')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
        size="sm"
      >
        <BookPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Asignar curso
      </Button>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
      >
        <SheetContent
          side="right"
          className="border-nexus-border bg-nexus-surface flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetTitle className="border-nexus-border border-b px-5 py-4 text-base font-semibold">
            Asignar cursos al usuario
          </SheetTitle>

          {/* Search */}
          <div className="border-nexus-border border-b px-4 py-3">
            <div className="relative">
              <Search
                className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar cursos por título..."
                aria-label="Buscar cursos"
                autoFocus
                className={cn(
                  'border-nexus-border bg-nexus-card text-nexus-text w-full rounded-lg border py-2 pr-4 pl-9 text-sm',
                  'placeholder:text-nexus-muted/60',
                  'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
                  'transition-colors'
                )}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {debouncedSearch.length < 2 ? (
              <p className="text-nexus-muted px-4 py-10 text-center text-sm">
                Escribí al menos 2 caracteres para buscar
              </p>
            ) : isLoading ? (
              <p className="text-nexus-muted flex items-center justify-center gap-2 px-4 py-10 text-center text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </p>
            ) : courses.length === 0 ? (
              <p className="text-nexus-muted px-4 py-10 text-center text-sm">
                No se encontraron cursos
              </p>
            ) : (
              <ul className="divide-nexus-border divide-y">
                {courses.map((course) => {
                  const alreadyEnrolled = enrolledCourseIds.includes(course.id)
                  const isSelected = selected.has(course.id)

                  return (
                    <li key={course.id}>
                      <button
                        type="button"
                        onClick={() => toggleCourse(course.id)}
                        disabled={alreadyEnrolled}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                          alreadyEnrolled
                            ? 'cursor-default opacity-50'
                            : isSelected
                              ? 'bg-nexus-accent-muted'
                              : 'hover:bg-nexus-card'
                        )}
                      >
                        {/* Checkbox indicator */}
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                            isSelected && !alreadyEnrolled
                              ? 'bg-nexus-accent border-nexus-accent text-white'
                              : 'border-nexus-border-strong'
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && !alreadyEnrolled && (
                            <svg
                              viewBox="0 0 10 8"
                              className="h-2.5 w-2.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 4l2.5 2.5L9 1" />
                            </svg>
                          )}
                        </span>

                        {/* Mini cover */}
                        <div className="bg-nexus-bg h-10 w-16 shrink-0 overflow-hidden rounded">
                          {course.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={course.coverUrl}
                              alt={course.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Search className="text-nexus-muted/30 h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-nexus-text truncate text-sm font-medium">
                            {course.title}
                          </p>
                          {course.instructor && (
                            <p className="text-nexus-muted truncate text-xs">
                              {course.instructor.firstName} {course.instructor.lastName}
                            </p>
                          )}
                        </div>

                        {alreadyEnrolled && (
                          <span className="text-nexus-muted bg-nexus-card shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                            Ya inscripto
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-nexus-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-nexus-muted text-sm">
              {selected.size > 0
                ? `${selected.size} curso${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}`
                : 'Ninguno seleccionado'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="border-nexus-border text-nexus-muted"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={selected.size === 0 || isPending}
                className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
              >
                {isPending ? 'Asignando...' : 'Asignar seleccionados'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
