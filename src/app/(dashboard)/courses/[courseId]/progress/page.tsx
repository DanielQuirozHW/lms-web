import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen, Trophy, Clock } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import { ProgressTimeline } from '@/components/features/courses/ProgressTimeline'
import { GenerateCertificateButton } from '@/components/features/certificates/GenerateCertificateButton'
import type { CourseDetail, EnrollmentDetail } from '@/types/models'
import type { ModuleWithLessons } from '@/hooks/queries/modules'

interface PageProps {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ enrollmentId?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  try {
    const r = await api.get<CourseDetail>(`/courses/${courseId}`, { headers })
    return { title: `Mi progreso | ${r.data.title} | NexusLMS` }
  } catch {
    return { title: 'Mi progreso | NexusLMS' }
  }
}

export default async function CourseProgressPage({ params, searchParams }: PageProps) {
  const { courseId } = await params
  const { enrollmentId } = await searchParams

  if (!enrollmentId) redirect(`/courses/${courseId}`)

  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch enrollment and modules in parallel
  const [enrollmentResult, modulesResult, courseResult] = await Promise.allSettled([
    api.get<EnrollmentDetail>(`/enrollments/${enrollmentId}`, { headers }),
    api.get<ModuleWithLessons[]>(`/courses/${courseId}/modules`, { headers }),
    api.get<CourseDetail>(`/courses/${courseId}`, { headers }),
  ])

  // If enrollment fetch fails (404 = not enrolled), redirect to course detail
  if (enrollmentResult.status === 'rejected') {
    const is404 =
      isApiError(enrollmentResult.reason) &&
      enrollmentResult.reason.response?.data.statusCode === 404
    if (is404) redirect(`/courses/${courseId}`)
    throw enrollmentResult.reason
  }

  const enrollment = enrollmentResult.value.data

  // Guard: the enrollment must belong to the current user and this course
  if (
    enrollment.courseId !== courseId ||
    (session?.user?.id && enrollment.userId !== session.user.id)
  ) {
    redirect(`/courses/${courseId}`)
  }

  const modules: ModuleWithLessons[] =
    modulesResult.status === 'fulfilled' ? (modulesResult.value.data ?? []) : []

  const course: CourseDetail | null =
    courseResult.status === 'fulfilled' ? courseResult.value.data : null

  const progress = enrollment.progress
  const pct = Math.round(progress.progressPercentage)

  // Derive completed lesson IDs from sequential lesson order and completed count
  const allLessons = modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => m.lessons.slice().sort((a, b) => a.order - b.order))

  const completedLessonIds = allLessons.slice(0, progress.completedLessons).map((l) => l.id)

  // Total watched seconds across all lessons (if progress is embedded in lesson data)
  const totalWatchedSeconds = allLessons
    .slice(0, progress.completedLessons)
    .reduce<number>((sum, l) => {
      const d = l.duration ?? 0
      return sum + d
    }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/courses/${courseId}`}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-nexus-muted hover:text-nexus-text mb-2 -ml-2 flex items-center gap-1',
          })}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Volver al curso
        </Link>

        <h1 className="text-nexus-text text-2xl font-bold">{course?.title ?? 'Mi progreso'}</h1>
        <p className="text-nexus-muted mt-1 text-sm">Historial de progreso</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Progreso"
          value={`${pct}%`}
          icon={
            <div className="bg-nexus-accent/20 text-nexus-accent rounded-full p-2">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        />
        <StatCard
          label="Lecciones"
          value={`${progress.completedLessons} / ${allLessons.length}`}
          icon={
            <div className="bg-nexus-success/20 text-nexus-success rounded-full p-2">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        />
        <StatCard
          label="Calificación"
          value={progress.finalGrade !== null ? `${progress.finalGrade}%` : '—'}
          icon={
            <div className="rounded-full bg-amber-500/20 p-2 text-amber-500">
              <Trophy className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        />
        <StatCard
          label="Tiempo"
          value={totalWatchedSeconds > 0 ? formatDuration(totalWatchedSeconds) : '—'}
          icon={
            <div className="bg-nexus-muted/20 text-nexus-muted rounded-full p-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-nexus-text font-medium">Progreso total</span>
          <span className="text-nexus-muted">{pct}%</span>
        </div>
        <div
          className="bg-nexus-border h-3 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso total: ${pct}%`}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              enrollment.status === 'COMPLETED' ? 'bg-nexus-success' : 'bg-nexus-accent'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Certificate CTA — shown when course is completed or 100% progress */}
      {(enrollment.status === 'COMPLETED' || pct >= 100) && (
        <div className="border-nexus-border bg-nexus-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
          <p className="text-nexus-text font-semibold">¡Felicitaciones! Completaste el curso</p>
          <p className="text-nexus-muted text-sm">Obtené tu certificado oficial de finalización.</p>
          <GenerateCertificateButton enrollmentId={enrollmentId} />
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-nexus-text mb-4 text-lg font-semibold">Lecciones completadas</h2>
        <ProgressTimeline modules={modules} completedLessonIds={completedLessonIds} />
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="border-nexus-border bg-nexus-card flex items-center gap-3 rounded-xl border p-4">
      {icon}
      <div className="min-w-0">
        <p className="text-nexus-muted text-xs">{label}</p>
        <p className="text-nexus-text truncate text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}
