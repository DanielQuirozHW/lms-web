'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, ChevronDown, ChevronUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StudentProgressDetail } from './StudentProgressDetail'
import { cn } from '@/lib/utils'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'
import { enrollmentKeys } from '@/hooks/queries/enrollments'
import { useQueryClient } from '@tanstack/react-query'
import type { EnrollmentWithStudent } from '@/hooks/queries/enrollments'
import type { EnrollmentStatus, UserRole } from '@/types/models'

const statusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-nexus-accent/15 text-nexus-accent' },
  COMPLETED: { label: 'Completado', className: 'bg-nexus-success/15 text-nexus-success' },
  CANCELLED: { label: 'Cancelado', className: 'bg-nexus-muted/10 text-nexus-muted' },
}

interface StudentListProps {
  courseId: string
  initialEnrollments: EnrollmentWithStudent[]
  currentUserRoles: UserRole[]
}

function getStudentDisplay(enrollment: EnrollmentWithStudent) {
  if (enrollment.student) {
    const { firstName, lastName, email, avatarUrl } = enrollment.student
    return {
      name: `${firstName} ${lastName}`.trim() || 'Sin nombre',
      initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?',
      email,
      avatarUrl,
    }
  }
  return {
    name: `ID: ${enrollment.userId.slice(0, 8)}`,
    initials: '?',
    email: '',
    avatarUrl: null,
  }
}

function exportCSV(enrollments: EnrollmentWithStudent[]) {
  const headers = [
    'Nombre',
    'Email',
    'Inscripto',
    'Progreso %',
    'Lecciones completadas',
    'Nota final',
    'Estado',
    'Última actividad',
  ]
  const rows = enrollments.map((e) => {
    const s = getStudentDisplay(e)
    return [
      s.name,
      s.email,
      formatDate(e.enrolledAt),
      `${Math.round(e.progress.progressPercentage)}`,
      `${e.progress.completedLessons}/${e.progress.totalLessons}`,
      e.progress.finalGrade != null ? `${e.progress.finalGrade.toFixed(1)}` : '',
      statusConfig[e.status]?.label ?? e.status,
      formatDate(e.updatedAt),
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `estudiantes-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function StudentList({ courseId, initialEnrollments, currentUserRoles }: StudentListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [enrollments] = useState<EnrollmentWithStudent[]>(initialEnrollments)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isAdmin = currentUserRoles.includes('ADMIN')

  const { mutate: cancelEnrollment, isPending: isCancelling } = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.patch(`/enrollments/${enrollmentId}`, { status: 'CANCELLED' }),
    onSuccess: () => {
      toast.success('Inscripción cancelada')
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.courseList(courseId) })
      router.refresh()
    },
    onError: () => toast.error('No se pudo cancelar la inscripción'),
  })

  const filtered = enrollments.filter((e) => {
    if (!search) return true
    const s = getStudentDisplay(e)
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            aria-label="Buscar estudiante"
            className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus:border-nexus-accent focus:ring-nexus-accent/30 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-colors focus:ring-2 focus:outline-none"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCSV(filtered)}
          className="border-nexus-border text-nexus-muted hover:text-nexus-text"
        >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Exportar CSV
        </Button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-nexus-text text-sm font-medium">
            {search ? 'No se encontraron estudiantes' : 'Sin inscripciones aún'}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-nexus-accent flex items-center gap-1 text-xs hover:underline"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="border-nexus-border hidden overflow-x-auto rounded-xl border md:block">
          <table className="w-full text-sm" aria-label="Lista de estudiantes">
            <thead>
              <tr className="border-nexus-border bg-nexus-card border-b">
                <th className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Estudiante
                </th>
                <th className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Email
                </th>
                <th className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Inscripto
                </th>
                <th className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Progreso
                </th>
                <th className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Estado
                </th>
                <th className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Actividad
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-nexus-border divide-y">
              {filtered.map((enrollment) => {
                const s = getStudentDisplay(enrollment)
                const pct = Math.round(enrollment.progress?.progressPercentage ?? 0)
                const { label, className } = statusConfig[enrollment.status] ?? statusConfig.ACTIVE
                const isExpanded = expandedId === enrollment.id

                return (
                  <>
                    <tr
                      key={enrollment.id}
                      className={cn(
                        'bg-nexus-card transition-colors',
                        isExpanded && 'bg-nexus-accent-muted'
                      )}
                    >
                      {/* Avatar + name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={s.avatarUrl ?? undefined} alt={s.name} />
                            <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
                              {s.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-nexus-text font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-nexus-muted px-4 py-3">{s.email || '—'}</td>
                      <td className="text-nexus-muted px-4 py-3">
                        {formatDate(enrollment.enrolledAt)}
                      </td>
                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-nexus-border h-1.5 w-20 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                pct === 100 ? 'bg-nexus-success' : 'bg-nexus-accent'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-nexus-text tabular-nums">{pct}%</span>
                        </div>
                      </td>
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
                      <td className="text-nexus-muted px-4 py-3">
                        {formatRelativeTime(enrollment.updatedAt)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedId(isExpanded ? null : enrollment.id)}
                            className="text-nexus-muted hover:text-nexus-text h-7 gap-1 px-2 text-xs"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Ocultar progreso' : 'Ver progreso'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            Progreso
                          </Button>
                          {isAdmin && enrollment.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('¿Cancelar la inscripción de este estudiante?')) {
                                  cancelEnrollment(enrollment.id)
                                }
                              }}
                              disabled={isCancelling}
                              className="text-nexus-muted hover:text-destructive h-7 px-2 text-xs"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded progress detail */}
                    {isExpanded && (
                      <tr key={`${enrollment.id}-detail`} className="bg-nexus-bg">
                        <td colSpan={7}>
                          <StudentProgressDetail enrollmentId={enrollment.id} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filtered.map((enrollment) => {
            const s = getStudentDisplay(enrollment)
            const pct = Math.round(enrollment.progress?.progressPercentage ?? 0)
            const { label, className } = statusConfig[enrollment.status] ?? statusConfig.ACTIVE
            const isExpanded = expandedId === enrollment.id

            return (
              <div
                key={enrollment.id}
                className="border-nexus-border bg-nexus-card rounded-xl border"
              >
                <div className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={s.avatarUrl ?? undefined} alt={s.name} />
                    <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-sm">
                      {s.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-nexus-text truncate font-semibold">{s.name}</p>
                    {s.email && <p className="text-nexus-muted truncate text-xs">{s.email}</p>}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                      className
                    )}
                  >
                    {label}
                  </span>
                </div>

                <div className="space-y-2 px-4 pb-4">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="bg-nexus-border h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          pct === 100 ? 'bg-nexus-success' : 'bg-nexus-accent'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-nexus-muted text-xs tabular-nums">{pct}%</span>
                  </div>
                  <p className="text-nexus-muted text-xs">
                    Inscripto {formatDate(enrollment.enrolledAt)} ·{' '}
                    {formatRelativeTime(enrollment.updatedAt)}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(isExpanded ? null : enrollment.id)}
                      className="border-nexus-border text-nexus-muted"
                    >
                      {isExpanded ? 'Ocultar' : 'Ver progreso'}
                    </Button>
                    {isAdmin && enrollment.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('¿Cancelar la inscripción?')) {
                            cancelEnrollment(enrollment.id)
                          }
                        }}
                        disabled={isCancelling}
                        className="text-nexus-muted hover:text-destructive"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-nexus-border border-t">
                    <StudentProgressDetail enrollmentId={enrollment.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
