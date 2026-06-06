import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Course, LessonDetail, CourseModuleDetail, EnrollmentDetail } from '@/types/models'
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs'
import { LessonPageShell } from '@/components/features/lessons/LessonPageShell'
import { VideoPlayer } from '@/components/features/lessons/VideoPlayer'
import { TextLesson } from '@/components/features/lessons/TextLesson'
import { LessonNavigation } from '@/components/features/lessons/LessonNavigation'
import { LessonNotes } from '@/components/features/lessons/LessonNotes'
import { BookmarkButton } from '@/components/features/lessons/BookmarkButton'
import { QuizPlayer } from '@/components/features/quiz/QuizPlayer'
import { AssignmentPlayer } from '@/components/features/assignments/AssignmentPlayer'

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

// ─── Cached fetchers (dedup between generateMetadata and page) ────────────────

const fetchCourse = cache(
  async (identifier: string, token: string | undefined): Promise<Course> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return api.get<Course>(`/courses/${identifier}`, { headers }).then((r) => r.data)
  }
)

const fetchModules = cache(
  async (courseId: string, token: string | undefined): Promise<CourseModuleDetail[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return api
      .get<CourseModuleDetail[]>(`/courses/${courseId}/modules`, { headers })
      .then((r) => r.data)
  }
)

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId, lessonId } = await params
  const session = await auth()

  try {
    const course = await fetchCourse(courseId, session?.accessToken)
    const modules = await fetchModules(course.id, session?.accessToken)
    for (const mod of modules) {
      const lesson = mod.lessons.find((l) => l.id === lessonId)
      if (lesson) return { title: `${lesson.title} | NexusLMS` }
    }
  } catch {}

  return { title: 'Lección | NexusLMS' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // 1. Resolve course — accepts slug or UUID; subsequent calls use course.id
  let course: Course
  try {
    course = await fetchCourse(courseId, token)
  } catch (err) {
    if (isApiError(err) && err.response?.data.statusCode === 404) notFound()
    throw err
  }

  // 2. Modules + enrollment check in parallel (use course.id, not the URL param)
  const [modulesResult, enrollmentResult] = await Promise.allSettled([
    fetchModules(course.id, token),
    api.get<PaginatedData<EnrollmentDetail>>('/enrollments', {
      params: { courseId: course.id, limit: 1 },
      headers,
    }),
  ])

  // Redirect if not enrolled — redirect to slug-based course URL
  const isEnrolled =
    enrollmentResult.status === 'fulfilled' && (enrollmentResult.value.data.data?.length ?? 0) > 0
  if (!isEnrolled) redirect(`/courses/${course.slug}`)

  const modules: CourseModuleDetail[] =
    modulesResult.status === 'fulfilled' ? modulesResult.value : []

  // 3. Find the module containing this lesson (needed for the PATCH URL)
  const moduleForLesson = modules.find((m) => m.lessons.some((l) => l.id === lessonId))
  if (!moduleForLesson) notFound()

  // 4. Fetch the lesson detail (use course.id for the API path)
  let lesson: LessonDetail
  try {
    const r = await api.get<LessonDetail>(
      `/courses/${course.id}/modules/${moduleForLesson.id}/lessons/${lessonId}`,
      { headers }
    )
    lesson = r.data
  } catch (err) {
    if (isApiError(err) && err.response?.data.statusCode === 404) notFound()
    throw err
  }

  // 5. Compute prev / next lessons (across all modules, published only)
  const allLessons = modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) =>
      mod.lessons
        .filter((l) => l.isPublished)
        .sort((a, b) => a.order - b.order)
        .map((l) => ({ ...l, moduleId: mod.id }))
    )

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson =
    currentIndex > 0
      ? { id: allLessons[currentIndex - 1].id, title: allLessons[currentIndex - 1].title }
      : null
  const nextLesson =
    currentIndex < allLessons.length - 1
      ? { id: allLessons[currentIndex + 1].id, title: allLessons[currentIndex + 1].title }
      : null

  // 6. Enrollment progress for the sidebar progress bar
  const enrollment =
    enrollmentResult.status === 'fulfilled' ? enrollmentResult.value.data.data?.[0] : null
  const progressPercentage = enrollment?.progress?.progressPercentage ?? 0

  // Determine if the current lesson has a blocking quiz/assignment
  const blocksProgress = (lesson.quizSettings?.blocksProgress ?? false) || false

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <LessonPageShell
      courseId={course.slug}
      courseTitle={course.title}
      modules={modules}
      activeLessonId={lessonId}
      progressPercentage={progressPercentage}
      completedLessonIds={[]} // per-lesson completion requires dedicated endpoint
    >
      {/* Inject course + lesson titles into the NavigationShell breadcrumb */}
      <Breadcrumbs
        overrides={{ [courseId]: course.title, [lessonId]: lesson.title }}
        hrefOverrides={{ [courseId]: `/courses/${course.slug}` }}
      />

      {/* Lesson header */}
      <div>
        <p className="text-nexus-muted mb-1 text-xs font-semibold tracking-widest uppercase">
          {moduleForLesson.title}
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-nexus-text text-2xl font-bold">{lesson.title}</h1>
          <BookmarkButton lessonId={lessonId} />
        </div>
      </div>

      {/* Lesson content by type */}
      {lesson.type === 'VIDEO' && lesson.videoUrl ? (
        <VideoPlayer
          videoUrl={lesson.videoUrl}
          courseId={course.id}
          moduleId={moduleForLesson.id}
          lessonId={lessonId}
          onComplete={() => {
            // Server Component can't update state; the mutation handles the backend call.
            // Navigation refresh is handled by the mutation's cache invalidation.
          }}
        />
      ) : lesson.type === 'VIDEO' ? (
        <div className="bg-nexus-card flex aspect-video items-center justify-center rounded-xl">
          <p className="text-nexus-muted text-sm">Video no disponible</p>
        </div>
      ) : null}

      {lesson.type === 'TEXT' && lesson.content ? (
        <TextLesson
          content={lesson.content}
          courseId={course.id}
          moduleId={moduleForLesson.id}
          lessonId={lessonId}
          onComplete={() => {}}
        />
      ) : lesson.type === 'TEXT' ? (
        <p className="text-nexus-muted text-sm">Contenido no disponible.</p>
      ) : null}

      {lesson.type === 'QUIZ' && (
        <QuizPlayer
          lessonId={lessonId}
          nextLessonHref={nextLesson ? `/courses/${course.slug}/learn/${nextLesson.id}` : null}
        />
      )}

      {lesson.type === 'ASSIGNMENT' && (
        <AssignmentPlayer
          lessonId={lessonId}
          nextLessonHref={nextLesson ? `/courses/${course.slug}/learn/${nextLesson.id}` : null}
        />
      )}

      {/* Lesson notes */}
      <LessonNotes key={lessonId} lessonId={lessonId} />

      {/* Lesson navigation */}
      <LessonNavigation
        courseId={course.slug}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        blocksProgress={blocksProgress}
      />
    </LessonPageShell>
  )
}
