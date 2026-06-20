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
import { Star, BookOpen, Users, Check, Clock, BarChart2 } from 'lucide-react'
import { formatPrice, formatDuration } from '@/lib/utils'
import type { CourseLevel } from '@/types/models'

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

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

  // First lesson ID for the "Continue learning" link
  const firstLessonId = modules[0]?.lessons?.[0]?.id

  return (
    <div className="space-y-0">
      {/* Inject course title into the breadcrumb rendered by NavigationShell */}
      <Breadcrumbs overrides={{ [courseId]: course.title }} />

      {/* Hero — full-width, flush with layout edges */}
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6">
        <CourseHero course={course} rating={rating} />
      </div>

      {/* Two-column body */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Modules — 60% desktop, order-2 on mobile */}
        <section className="order-2 min-w-0 flex-1 lg:order-1" aria-labelledby="modules-heading">
          {course.description && (
            <div className="mb-6">
              <h2 className="text-nexus-text mb-2 text-lg font-semibold">Sobre este curso</h2>
              <p className="text-nexus-muted text-sm leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* What you'll learn */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <div className="mb-6">
              <h2 className="text-nexus-text mb-3 text-lg font-semibold">Lo que vas a aprender</h2>
              <div
                className="border-nexus-border bg-nexus-card rounded-2xl border p-5"
                style={{ boxShadow: 'var(--nexus-card-shadow)' }}
              >
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {course.whatYouWillLearn.map((item, i) => (
                    <li key={i} className="text-nexus-muted flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <h2 id="modules-heading" className="text-nexus-text mb-3 text-lg font-semibold">
            Contenido del curso
          </h2>
          <Suspense fallback={<LoadingSpinner rows={4} />}>
            <CourseModules modules={modules} isEnrolled={isEnrolled} courseId={course.slug} />
          </Suspense>
        </section>

        {/* Enrollment card — order-1 on mobile (below hero), order-2 on desktop */}
        <aside
          className="order-1 w-full lg:order-2 lg:w-[38%] lg:shrink-0"
          aria-label="Inscripción al curso"
        >
          <div className="border-nexus-border bg-nexus-card rounded-2xl border p-6 lg:sticky lg:top-20">
            {/* Price — only shown for PAID courses */}
            {course.enrollmentType === 'PAID' && (
              <p className="text-nexus-accent mb-4 text-3xl font-bold">
                {formatPrice(course.price ?? 0)}
              </p>
            )}

            {/* Enroll / continue button */}
            <EnrollButton
              courseId={course.id}
              isEnrolled={isEnrolled}
              enrollmentType={course.enrollmentType}
              price={course.price}
              firstLessonId={firstLessonId}
            />

            {/* Progress bar — only when enrolled */}
            {isEnrolled && (
              <div className="mt-4">
                <div className="text-nexus-muted mb-1 flex justify-between text-xs">
                  <span>Tu progreso</span>
                  <span className="text-nexus-text font-medium">{progressPercentage}%</span>
                </div>
                <div className="bg-nexus-border h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-nexus-accent h-full rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Course stats */}
            <ul className="mt-5 space-y-2.5 text-sm" aria-label="Información del curso">
              <li className="text-nexus-muted flex items-center gap-2">
                <BookOpen className="text-nexus-accent h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="text-nexus-text font-semibold">{course.lessonsCount}</span>{' '}
                  lecciones
                </span>
              </li>
              <li className="text-nexus-muted flex items-center gap-2">
                <Users className="text-nexus-accent h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="text-nexus-text font-semibold">{course.enrollmentsCount}</span>{' '}
                  estudiantes inscritos
                </span>
              </li>
              {rating && (
                <li className="text-nexus-muted flex items-center gap-2">
                  <Star
                    className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="text-nexus-text font-semibold">
                      {rating.averageScore.toFixed(1)}
                    </span>{' '}
                    promedio ({rating.totalRatings} valoraciones)
                  </span>
                </li>
              )}
              {course.level && (
                <li className="text-nexus-muted flex items-center gap-2">
                  <BarChart2 className="text-nexus-accent h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Nivel{' '}
                    <span className="text-nexus-text font-semibold">
                      {LEVEL_LABELS[course.level]}
                    </span>
                  </span>
                </li>
              )}
              {course.totalDuration > 0 && (
                <li className="text-nexus-muted flex items-center gap-2">
                  <Clock className="text-nexus-accent h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="text-nexus-text font-semibold">
                      {formatDuration(course.totalDuration)}
                    </span>{' '}
                    duración total
                  </span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
