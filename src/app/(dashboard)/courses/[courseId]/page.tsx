// TODO: Consider adding generateStaticParams for published courses
// to enable static generation at build time (significant TTFB improvement).
// Blocked by: auth check for draft/archived courses requires dynamic rendering.
// Revisit when a public course catalog (no auth) is implemented.
import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { CourseModuleDetail, Enrollment, RatingSummary } from '@/types/models'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { Suspense } from 'react'
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs'
import { CourseHero, type CourseDetailFull } from '@/components/features/courses/CourseHero'
import { CourseModules } from '@/components/features/courses/CourseModules'
import { EnrollButton } from '@/components/features/courses/EnrollButton'
import {
  Star,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  BarChart2,
  Award,
  Check,
  Bookmark,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { CourseLevel } from '@/types/models'

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

// Progress ring geometry
const RING_R = 43.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R // ≈ 273.32

interface PageProps {
  params: Promise<{ courseId: string }>
}

// React.cache deduplicates this fetch between generateMetadata and the page
// within the same server request.
const fetchCourse = cache(
  async (courseId: string, token: string | undefined): Promise<CourseDetailFull> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return api.get<CourseDetailFull>(`/courses/${courseId}`, { headers }).then((r) => r.data)
  }
)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  const session = await auth()
  try {
    const course = await fetchCourse(courseId, session?.accessToken)
    return { title: `${course.title} | NexusLMS` }
  } catch {
    return { title: 'Curso | NexusLMS' }
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch course first — call notFound() on 404 or non-published status
  let course: CourseDetailFull
  try {
    course = await fetchCourse(courseId, token)
  } catch (err) {
    if (isApiError(err) && err.response?.data.statusCode === 404) notFound()
    throw err
  }
  if (course.status !== 'PUBLISHED') notFound()

  // Remaining fetches in parallel — use course.id (not the URL param) so
  // slug-based URLs don't break routes that only accept UUIDs.
  const [modulesResult, ratingResult, enrollmentResult] = await Promise.allSettled([
    api.get<CourseModuleDetail[]>(`/courses/${course.id}/modules`, { headers }),
    api.get<RatingSummary>(`/ratings/course/${course.id}/summary`, { headers }),
    api.get<PaginatedData<Enrollment>>('/enrollments', {
      params: { courseId: course.id, limit: 1 },
      headers,
    }),
  ])

  const modules: CourseModuleDetail[] =
    modulesResult.status === 'fulfilled' ? (modulesResult.value.data ?? []) : []

  const rating: RatingSummary | null =
    ratingResult.status === 'fulfilled' ? ratingResult.value.data : null

  const isEnrolled: boolean =
    enrollmentResult.status === 'fulfilled'
      ? (enrollmentResult.value.data.data?.length ?? 0) > 0
      : false

  const enrollmentId =
    enrollmentResult.status === 'fulfilled'
      ? (enrollmentResult.value.data.data?.[0]?.id ?? null)
      : null

  let progressPercentage = 0
  if (enrollmentId) {
    try {
      const summaryRes = await api.get<{ progressPercentage: number }>(
        `/enrollments/${enrollmentId}/progress-summary`,
        { headers }
      )
      progressPercentage = summaryRes.data.progressPercentage ?? 0
    } catch {}
  }

  // Progress ring calculation
  const ringOffset = RING_CIRCUMFERENCE * (1 - progressPercentage / 100)
  const completedLessons = Math.round((progressPercentage / 100) * course.lessonsCount)

  // First lesson ID for the "Continue learning" link
  const firstLessonId = modules[0]?.lessons?.[0]?.id

  // Instructor display helpers
  const instructorName = course.instructor
    ? `${course.instructor.firstName} ${course.instructor.lastName}`
    : null
  const instructorInitials = course.instructor
    ? `${course.instructor.firstName[0] ?? ''}${course.instructor.lastName[0] ?? ''}`.toUpperCase()
    : ''

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs overrides={{ [courseId]: course.title }} />

      {/* Hero — gradient banner */}
      <CourseHero course={course} rating={rating} />

      {/* Two-column body */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main content — order-2 on mobile (below sidebar), order-1 on desktop */}
        <section className="order-2 min-w-0 flex-1 lg:order-1" aria-labelledby="modules-heading">
          {/* Sobre este curso */}
          {course.description && (
            <div className="mb-6">
              <h2
                className="text-nexus-text mb-1.5 font-extrabold tracking-[-0.01em]"
                style={{ fontSize: 19 }}
              >
                Sobre este curso
              </h2>
              <p className="text-nexus-muted max-w-2xl leading-[1.65]" style={{ fontSize: 15 }}>
                {course.description}
              </p>
            </div>
          )}

          {/* Lo que aprenderás */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <div className="mb-6">
              <h2 className="text-nexus-text mb-3 font-bold" style={{ fontSize: 18 }}>
                Lo que aprenderás
              </h2>
              <div
                className="border-nexus-border bg-nexus-card rounded-2xl border p-6"
                style={{ boxShadow: 'var(--nexus-card-shadow)' }}
              >
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {course.whatYouWillLearn.map((item, i) => (
                    <li key={i} className="text-nexus-muted flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-green-600 dark:text-green-400"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Contenido del curso */}
          <div className="mb-3.5 flex items-baseline justify-between gap-4">
            <h2
              id="modules-heading"
              className="text-nexus-text font-extrabold tracking-[-0.01em]"
              style={{ fontSize: 19 }}
            >
              Contenido del curso
            </h2>
            {modules.length > 0 && (
              <span className="text-nexus-muted shrink-0 text-[13px] font-semibold">
                {modules.length} módulo{modules.length !== 1 ? 's' : ''} · {course.lessonsCount}{' '}
                lecciones
                {course.totalDuration > 0 && ` · ${formatDuration(course.totalDuration)}`}
              </span>
            )}
          </div>
          <Suspense fallback={<LoadingSpinner rows={4} />}>
            <CourseModules modules={modules} isEnrolled={isEnrolled} courseId={course.slug} />
          </Suspense>
        </section>

        {/* Sticky sidebar — order-1 on mobile (right below hero), order-2 on desktop */}
        <aside
          className="order-1 w-full lg:order-2 lg:w-93 lg:shrink-0"
          aria-label="Información del curso"
        >
          <div className="sticky top-6 flex flex-col gap-4">
            {/* Main enrollment / progress card */}
            <div
              className="border-nexus-border bg-nexus-card rounded-[18px] border p-5.5"
              style={{ boxShadow: 'var(--nexus-card-shadow)' }}
            >
              {/* Progress ring — enrolled only */}
              {isEnrolled && (
                <div className="mb-5 flex items-center gap-4.5">
                  {/* SVG circular progress ring */}
                  <div className="relative h-24 w-24 shrink-0">
                    <svg
                      width="96"
                      height="96"
                      viewBox="0 0 96 96"
                      style={{ transform: 'rotate(-90deg)', display: 'block' }}
                      aria-hidden="true"
                    >
                      <circle
                        cx="48"
                        cy="48"
                        r={RING_R}
                        fill="none"
                        stroke="var(--nexus-border)"
                        strokeWidth="9"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={RING_R}
                        fill="none"
                        stroke="var(--nexus-accent)"
                        strokeWidth="9"
                        strokeDasharray={RING_CIRCUMFERENCE.toFixed(2)}
                        strokeDashoffset={ringOffset.toFixed(2)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-nexus-text leading-none font-extrabold"
                        style={{ fontSize: 22 }}
                      >
                        {progressPercentage}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-nexus-text font-extrabold" style={{ fontSize: 16 }}>
                      Tu progreso
                    </p>
                    <p className="text-nexus-muted mt-0.75" style={{ fontSize: 13.5 }}>
                      {completedLessons} de {course.lessonsCount} lecciones completadas
                    </p>
                    <p className="text-nexus-faint mt-0.5" style={{ fontSize: 12.5 }}>
                      Continuá donde lo dejaste
                    </p>
                  </div>
                </div>
              )}

              {/* Enroll / continue button */}
              <EnrollButton
                courseId={course.id}
                isEnrolled={isEnrolled}
                enrollmentType={course.enrollmentType}
                price={course.price}
                firstLessonId={firstLessonId}
              />

              {/* Save course — placeholder */}
              <button
                type="button"
                disabled
                className="mt-2.5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[13px] border px-4 py-3 text-[14px] font-bold opacity-50 transition-colors"
                style={{
                  borderColor: 'var(--btn-outline-border)',
                  color: 'var(--nexus-text)',
                  background: 'transparent',
                }}
                aria-label="Guardar curso (próximamente)"
              >
                <Bookmark className="h-4.5 w-4.5" aria-hidden="true" />
                Guardar curso
              </button>

              {/* Course stats list */}
              <div className="mt-4.5">
                {/* Lecciones */}
                <div className="border-nexus-border flex items-center gap-3 border-b py-2.75 first:pt-0">
                  <span className="text-nexus-accent flex w-5 justify-center">
                    <BookOpen className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span className="text-nexus-muted flex-1 text-[13.5px]">Lecciones</span>
                  <span className="text-nexus-text text-[13.5px] font-bold">
                    {course.lessonsCount}
                  </span>
                </div>

                {/* Estudiantes */}
                <div className="border-nexus-border flex items-center gap-3 border-b py-2.75">
                  <span className="text-nexus-accent flex w-5 justify-center">
                    <Users className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span className="text-nexus-muted flex-1 text-[13.5px]">
                    Estudiantes inscritos
                  </span>
                  <span className="text-nexus-text text-[13.5px] font-bold">
                    {course.enrollmentsCount}
                  </span>
                </div>

                {/* Rating */}
                {rating && (
                  <div className="border-nexus-border flex items-center gap-3 border-b py-2.75">
                    <span className="text-nexus-accent flex w-5 justify-center">
                      <Star className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="text-nexus-muted flex-1 text-[13.5px]">Valoración</span>
                    <span className="text-nexus-text text-[13.5px] font-bold">
                      {rating.averageScore.toFixed(1)} ({rating.totalRatings})
                    </span>
                  </div>
                )}

                {/* Nivel */}
                {course.level && (
                  <div className="border-nexus-border flex items-center gap-3 border-b py-2.75">
                    <span className="text-nexus-accent flex w-5 justify-center">
                      <BarChart2 className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="text-nexus-muted flex-1 text-[13.5px]">Nivel</span>
                    <span className="text-nexus-text text-[13.5px] font-bold">
                      {LEVEL_LABELS[course.level]}
                    </span>
                  </div>
                )}

                {/* Duración total */}
                {course.totalDuration > 0 && (
                  <div className="border-nexus-border flex items-center gap-3 border-b py-2.75">
                    <span className="text-nexus-accent flex w-5 justify-center">
                      <Clock className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="text-nexus-muted flex-1 text-[13.5px]">Duración total</span>
                    <span className="text-nexus-text text-[13.5px] font-bold">
                      {formatDuration(course.totalDuration)}
                    </span>
                  </div>
                )}

                {/* Certificado al finalizar */}
                <div className="flex items-center gap-3 py-2.75">
                  <span className="text-nexus-accent flex w-5 justify-center">
                    <Award className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span className="text-nexus-muted flex-1 text-[13.5px]">
                    Certificado al finalizar
                  </span>
                  <Check
                    className="h-4.5 w-4.5 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* Instructor card */}
            {instructorName && (
              <div
                className="border-nexus-border bg-nexus-card flex items-center gap-3.25 rounded-[18px] border p-4"
                style={{ boxShadow: 'var(--nexus-card-shadow)' }}
              >
                {/* Avatar */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-extrabold text-white"
                  style={{ background: 'var(--nexus-brand-gradient)' }}
                  aria-hidden="true"
                >
                  {course.instructor?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.instructor.avatarUrl}
                      alt={instructorName}
                      className="h-full w-full rounded-[12px] object-cover"
                    />
                  ) : (
                    instructorInitials
                  )}
                </div>

                <div>
                  <p className="text-nexus-faint text-[12px]">Instructor</p>
                  <p className="text-nexus-text text-[14.5px] font-bold">{instructorName}</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
