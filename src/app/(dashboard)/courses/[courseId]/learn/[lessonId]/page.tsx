import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { LessonDetail, CourseModuleDetail, EnrollmentDetail } from '@/types/models'
import { LessonPageShell } from '@/components/features/lessons/LessonPageShell'
import { VideoPlayer } from '@/components/features/lessons/VideoPlayer'
import { TextLesson } from '@/components/features/lessons/TextLesson'
import { LessonNavigation } from '@/components/features/lessons/LessonNavigation'
import { QuizPlayer } from '@/components/features/quiz/QuizPlayer'
import { AssignmentPlayer } from '@/components/features/assignments/AssignmentPlayer'

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

// ─── Cached fetchers (dedup between generateMetadata and page) ────────────────

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
    const modules = await fetchModules(courseId, session?.accessToken)
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

  // 1. Modules + enrollment check in parallel
  const [modulesResult, enrollmentResult] = await Promise.allSettled([
    fetchModules(courseId, token),
    api.get<PaginatedData<EnrollmentDetail>>('/enrollments', {
      params: { courseId, limit: 1 },
      headers,
    }),
  ])

  // Redirect if not enrolled
  const isEnrolled =
    enrollmentResult.status === 'fulfilled' && (enrollmentResult.value.data.data?.length ?? 0) > 0
  if (!isEnrolled) redirect(`/courses/${courseId}`)

  const modules: CourseModuleDetail[] =
    modulesResult.status === 'fulfilled' ? modulesResult.value : []

  // 2. Find the module containing this lesson (needed for the PATCH URL)
  const moduleForLesson = modules.find((m) => m.lessons.some((l) => l.id === lessonId))
  if (!moduleForLesson) notFound()

  // 3. Fetch the lesson detail
  let lesson: LessonDetail
  try {
    const r = await api.get<LessonDetail>(
      `/courses/${courseId}/modules/${moduleForLesson.id}/lessons/${lessonId}`,
      { headers }
    )
    lesson = r.data
  } catch (err) {
    if (isApiError(err) && err.response?.data.statusCode === 404) notFound()
    throw err
  }

  // 4. Compute prev / next lessons (across all modules, published only)
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

  // 5. Course title from modules data (use first module's courseId reference or fallback)
  const courseTitle = 'Curso' // Will be shown in sidebar header; could be fetched via /courses/:id

  // 6. Enrollment progress for the sidebar progress bar
  const enrollment =
    enrollmentResult.status === 'fulfilled' ? enrollmentResult.value.data.data?.[0] : null
  const progressPercentage = enrollment?.progress?.progressPercentage ?? 0

  // Determine if the current lesson has a blocking quiz/assignment
  const blocksProgress = (lesson.quizSettings?.blocksProgress ?? false) || false // assignment blocking not modeled in current types

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <LessonPageShell
      courseId={courseId}
      courseTitle={courseTitle}
      modules={modules}
      activeLessonId={lessonId}
      progressPercentage={progressPercentage}
      completedLessonIds={[]} // per-lesson completion requires dedicated endpoint
    >
      {/* Lesson header */}
      <div>
        <p className="text-nexus-muted mb-1 text-xs font-semibold tracking-widest uppercase">
          {moduleForLesson.title}
        </p>
        <h1 className="text-nexus-text text-2xl font-bold">{lesson.title}</h1>
      </div>

      {/* Lesson content by type */}
      {lesson.type === 'VIDEO' && lesson.videoUrl ? (
        <VideoPlayer
          videoUrl={lesson.videoUrl}
          courseId={courseId}
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
          courseId={courseId}
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
          nextLessonHref={nextLesson ? `/courses/${courseId}/learn/${nextLesson.id}` : null}
        />
      )}

      {lesson.type === 'ASSIGNMENT' && (
        <AssignmentPlayer
          lessonId={lessonId}
          nextLessonHref={nextLesson ? `/courses/${courseId}/learn/${nextLesson.id}` : null}
        />
      )}

      {/* Lesson navigation */}
      <LessonNavigation
        courseId={courseId}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        blocksProgress={blocksProgress}
      />
    </LessonPageShell>
  )
}
