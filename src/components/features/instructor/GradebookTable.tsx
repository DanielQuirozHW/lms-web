'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StudentProgressDetail } from './StudentProgressDetail'
import { cn } from '@/lib/utils'
import type { Gradebook, StudentGrade } from '@/types/models'
import type { EnrollmentWithStudent } from '@/hooks/queries/enrollments'

interface GradebookTableProps {
  gradebook: Gradebook
  enrollments: EnrollmentWithStudent[]
  studentGrades: StudentGrade[]
  courseId: string
}

function scoreColor(percentage: number | null): string {
  if (percentage === null) return 'text-nexus-muted'
  if (percentage < 60) return 'text-destructive'
  if (percentage < 80) return 'text-amber-500'
  return 'text-nexus-success'
}

function getStudentDisplay(enrollment: EnrollmentWithStudent) {
  if (enrollment.student) {
    const { firstName, lastName, avatarUrl } = enrollment.student
    return {
      name: `${firstName} ${lastName}`.trim() || 'Sin nombre',
      initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?',
      avatarUrl,
    }
  }
  return { name: `ID: ${enrollment.userId.slice(0, 8)}`, initials: '?', avatarUrl: null }
}

export function GradebookTable({
  gradebook,
  enrollments,
  studentGrades,
  courseId: _courseId,
}: GradebookTableProps) {
  const [detailEnrollmentId, setDetailEnrollmentId] = useState<string | null>(null)

  // Build grade lookup: enrollmentId → StudentGrade
  const gradeMap = new Map<string, StudentGrade>()
  for (const g of studentGrades) {
    gradeMap.set(g.enrollmentId, g)
  }

  // Flatten all items across categories for column headers
  const allItems = gradebook.categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryName: cat.name, categoryId: cat.id }))
  )

  if (allItems.length === 0) {
    return (
      <p className="text-nexus-muted py-8 text-center text-sm">
        El libro de calificaciones no tiene ítems configurados.
      </p>
    )
  }

  return (
    <>
      <div className="border-nexus-border overflow-x-auto rounded-xl border">
        <table className="w-full text-sm" aria-label="Libro de calificaciones">
          <thead>
            {/* Category row */}
            <tr className="border-nexus-border bg-nexus-card border-b">
              <th className="text-nexus-muted px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase">
                Estudiante
              </th>
              {gradebook.categories.map((cat) => (
                <th
                  key={cat.id}
                  colSpan={cat.items.length}
                  className="text-nexus-muted px-3 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
                >
                  {cat.name} ({cat.weight}%)
                </th>
              ))}
              <th className="text-nexus-text px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                Nota final
              </th>
            </tr>
            {/* Item row */}
            <tr className="border-nexus-border bg-nexus-card border-b">
              <th />
              {allItems.map((item) => (
                <th key={item.id} className="text-nexus-muted px-3 py-1.5 text-center text-[10px]">
                  /{item.maxScore}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-nexus-border divide-y">
            {enrollments.length === 0 ? (
              <tr>
                <td
                  colSpan={allItems.length + 2}
                  className="text-nexus-muted py-8 text-center text-sm"
                >
                  Sin estudiantes inscritos
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => {
                const s = getStudentDisplay(enrollment)
                const grade = gradeMap.get(enrollment.id)
                const finalPct = grade?.finalGrade != null ? (grade.finalGrade / 100) * 100 : null

                return (
                  <tr
                    key={enrollment.id}
                    className="bg-nexus-card hover:bg-nexus-accent-muted/30 transition-colors"
                  >
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={s.avatarUrl ?? undefined} alt={s.name} />
                          <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-[10px]">
                            {s.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-nexus-text truncate text-sm font-medium">
                          {s.name}
                        </span>
                      </div>
                    </td>

                    {/* Grade cells */}
                    {allItems.map((item) => {
                      const catGrade = grade?.categories.find(
                        (c) => c.categoryId === item.categoryId
                      )
                      const itemGrade = catGrade?.items.find((i) => i.itemId === item.id)
                      const pct = itemGrade?.percentageScore ?? null

                      return (
                        <td
                          key={item.id}
                          className="cursor-pointer px-3 py-3 text-center"
                          onClick={() => setDetailEnrollmentId(enrollment.id)}
                          title="Ver detalle del estudiante"
                        >
                          <span className={cn('font-medium tabular-nums', scoreColor(pct))}>
                            {itemGrade?.rawScore != null ? `${itemGrade.rawScore}` : '—'}
                          </span>
                        </td>
                      )
                    })}

                    {/* Final grade */}
                    <td
                      className="cursor-pointer px-4 py-3 text-right"
                      onClick={() => setDetailEnrollmentId(enrollment.id)}
                    >
                      <span
                        className={cn('text-base font-bold tabular-nums', scoreColor(finalPct))}
                      >
                        {grade?.finalGrade != null ? `${grade.finalGrade.toFixed(1)}` : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Student progress detail modal */}
      {detailEnrollmentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Progreso del estudiante"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailEnrollmentId(null)
          }}
        >
          <div className="border-nexus-border bg-nexus-card w-full max-w-lg rounded-2xl border shadow-2xl">
            <div className="border-nexus-border flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-nexus-text text-sm font-semibold">
                {(() => {
                  const e = enrollments.find((en) => en.id === detailEnrollmentId)
                  return e ? getStudentDisplay(e).name : 'Progreso'
                })()}
              </h3>
              <button
                type="button"
                onClick={() => setDetailEnrollmentId(null)}
                aria-label="Cerrar"
                className="text-nexus-muted hover:text-nexus-text transition-colors"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <StudentProgressDetail enrollmentId={detailEnrollmentId} />
          </div>
        </div>
      )}
    </>
  )
}
