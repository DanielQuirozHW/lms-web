'use client'

import { BookOpen, CheckCircle2, Trophy, Clock } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { useEnrollmentDetail } from '@/hooks/queries/enrollments'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface StudentProgressDetailProps {
  enrollmentId: string
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: string
  icon: React.ElementType
  className?: string
}) {
  return (
    <div className="border-nexus-border bg-nexus-card flex items-center gap-3 rounded-xl border p-4">
      <div className="bg-nexus-accent/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        <Icon className="text-nexus-accent h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className={cn('text-lg font-bold tabular-nums', className ?? 'text-nexus-text')}>
          {value}
        </p>
        <p className="text-nexus-muted text-xs">{label}</p>
      </div>
    </div>
  )
}

export function StudentProgressDetail({ enrollmentId }: StudentProgressDetailProps) {
  const { data: enrollment, isLoading, isError } = useEnrollmentDetail(enrollmentId)

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingSpinner rows={2} />
      </div>
    )
  }

  if (isError || !enrollment) {
    return <p className="text-nexus-muted p-4 text-sm">No se pudo cargar el progreso.</p>
  }

  const { progress } = enrollment
  const pct = Math.round(progress.progressPercentage)
  const gradeColor =
    progress.finalGrade === null
      ? 'text-nexus-muted'
      : progress.finalGrade >= 80
        ? 'text-nexus-success'
        : progress.finalGrade >= 60
          ? 'text-amber-500'
          : 'text-destructive'

  return (
    <div className="space-y-4 p-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Progreso general" value={`${pct}%`} icon={BookOpen} />
        <StatCard
          label="Lecciones completadas"
          value={`${progress.completedLessons} / ${progress.totalLessons}`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Nota final"
          value={progress.finalGrade != null ? `${progress.finalGrade.toFixed(1)}` : '—'}
          icon={Trophy}
          className={gradeColor}
        />
        <StatCard label="Inscripto el" value={formatDate(enrollment.enrolledAt)} icon={Clock} />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="text-nexus-muted flex items-center justify-between text-xs">
          <span>Progreso del curso</span>
          <span>{pct}%</span>
        </div>
        <div
          className="bg-nexus-border h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% completado`}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              pct === 100 ? 'bg-nexus-success' : 'bg-nexus-accent'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {enrollment.completedAt && (
        <p className="text-nexus-success text-xs">
          Completado el {formatDate(enrollment.completedAt)}
        </p>
      )}
    </div>
  )
}
