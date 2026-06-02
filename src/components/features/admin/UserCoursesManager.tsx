'use client'

import { useState } from 'react'
import { BookOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { EnrollmentStatus } from '@/types/models'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { enrollmentKeys, useUserEnrollments } from '@/hooks/queries/enrollments'
import { AssignCoursesModal } from './AssignCoursesModal'

const statusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-nexus-accent/15 text-nexus-accent' },
  COMPLETED: { label: 'Completado', className: 'bg-nexus-success/15 text-nexus-success' },
  CANCELLED: { label: 'Cancelado', className: 'bg-nexus-muted/10 text-nexus-muted' },
}

interface UserCoursesManagerProps {
  userId: string
}

export function UserCoursesManager({ userId }: UserCoursesManagerProps) {
  const queryClient = useQueryClient()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data, isLoading } = useUserEnrollments(userId)
  const enrollments = data?.data ?? []
  const enrolledCourseIds = enrollments.map((e) => e.courseId)

  const { mutate: removeEnrollment } = useMutation({
    mutationFn: (courseId: string) => api.delete(`/users/${userId}/enrollments/${courseId}`),
    onSuccess: () => {
      toast.success('Inscripción eliminada')
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.userList(userId) })
      setConfirmId(null)
    },
    onError: () => {
      toast.error('No se pudo eliminar la inscripción')
      setConfirmId(null)
    },
  })

  return (
    <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="text-nexus-accent h-4 w-4" aria-hidden="true" />
          <h2 className="text-nexus-text text-base font-semibold">
            Cursos asignados
            {enrollments.length > 0 && (
              <span className="text-nexus-muted ml-1.5 font-normal">({enrollments.length})</span>
            )}
          </h2>
        </div>
        <AssignCoursesModal userId={userId} enrolledCourseIds={enrolledCourseIds} />
      </div>

      {isLoading ? (
        <p className="text-nexus-muted py-4 text-center text-sm">Cargando cursos...</p>
      ) : enrollments.length === 0 ? (
        <p className="text-nexus-muted py-4 text-center text-sm">
          Este usuario no tiene cursos asignados.
        </p>
      ) : (
        <div className="divide-nexus-border divide-y">
          {enrollments.map((enrollment) => {
            const pct = Math.round(enrollment.progress?.progressPercentage ?? 0)
            const { label, className } = statusConfig[enrollment.status] ?? statusConfig.ACTIVE
            const courseTitle =
              enrollment.course?.title ?? `Curso ${enrollment.courseId.slice(0, 8)}…`
            const isConfirming = confirmId === enrollment.id

            return (
              <div key={enrollment.id} className="flex items-center gap-3 py-3">
                {/* Mini cover thumbnail */}
                <div className="bg-nexus-bg h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                  {enrollment.course?.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={enrollment.course.coverUrl}
                      alt={courseTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="text-nexus-muted/30 h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-nexus-text truncate text-sm font-medium">{courseTitle}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="bg-nexus-border h-1 w-16 overflow-hidden rounded-full">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          pct === 100 ? 'bg-nexus-success' : 'bg-nexus-accent'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-nexus-muted text-xs">{pct}%</span>
                    <span className="text-nexus-faint text-xs">·</span>
                    <span className="text-nexus-muted text-xs">
                      {formatDate(enrollment.enrolledAt)}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    className
                  )}
                >
                  {label}
                </span>

                {/* Remove with inline confirmation */}
                {isConfirming ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-nexus-muted text-xs">¿Eliminar?</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEnrollment(enrollment.courseId)}
                      className="text-nexus-danger hover:text-nexus-danger h-7 px-2 text-xs"
                    >
                      Sí
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmId(null)}
                      className="text-nexus-muted h-7 px-2 text-xs"
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmId(enrollment.id)}
                    className="text-nexus-muted hover:text-nexus-danger h-7 w-7 shrink-0 p-0 transition-colors"
                    aria-label={`Quitar curso ${courseTitle}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
