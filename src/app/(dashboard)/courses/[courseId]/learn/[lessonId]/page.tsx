import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'
import { auth } from '@/lib/auth'
import type { PaginatedData } from '@/types/api'
import type { Course, LessonDetail, CourseModuleDetail, EnrollmentDetail } from '@/types/models'
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

// Use native fetch() — the shared Axios instance has a request interceptor that
// fetches the token from /api/auth/token (browser-only). On the server it exits
// early without setting the Authorization header, so all server-side requests
// must bypass the Axios instance and call fetch() with explicit auth headers.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId, lessonId } = await params
  const session = await auth()
  const token = session?.accessToken
  if (!token) return { title: 'Lección | NexusLMS' }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  try {
    const courseRes = await fetch(`${BASE_URL}/courses/${courseId}`, {
      headers: authHeaders,
      cache: 'no-store',
    })
    if (!courseRes.ok) return { title: 'Lección | NexusLMS' }
    const { data: course } = (await courseRes.json()) as { data: Course }

    const modulesRes = await fetch(`${BASE_URL}/courses/${course.id}/modules`, {
      headers: authHeaders,
      cache: 'no-store',
    })
    if (!modulesRes.ok) return { title: 'Lección | NexusLMS' }
    const { data: modules } = (await modulesRes.json()) as { data: CourseModuleDetail[] }

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
  if (!token) redirect('/login')

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // 1. Resolve course (slug or UUID accepted by the backend)
  const courseRes = await fetch(`${BASE_URL}/courses/${courseId}`, {
    headers: authHeaders,
    cache: 'no-store',
  })
  if (courseRes.status === 404) notFound()
  if (!courseRes.ok) redirect('/login')
  const { data: course } = (await courseRes.json()) as { data: Course }

  // 2. Modules + enrollment check in parallel (all secondary calls use course.id)
  const [modulesResult, enrollmentResult] = await Promise.allSettled([
    fetch(`${BASE_URL}/courses/${course.id}/modules`, {
      headers: authHeaders,
      cache: 'no-store',
    }).then(async (r) => {
      if (!r.ok) throw new Error(`${r.status}`)
      const { data } = (await r.json()) as { data: CourseModuleDetail[] }
      return data
    }),
    fetch(`${BASE_URL}/enrollments?courseId=${encodeURIComponent(course.id)}&limit=1`, {
      headers: authHeaders,
      cache: 'no-store',
    }).then(async (r) => {
      if (!r.ok) throw new Error(`${r.status}`)
      const { data } = (await r.json()) as { data: PaginatedData<EnrollmentDetail> }
      return data
    }),
  ])

  // Redirect if not enrolled
  const isEnrolled =
    enrollmentResult.status === 'fulfilled' && (enrollmentResult.value.data?.length ?? 0) > 0
  if (!isEnrolled) redirect(`/courses/${course.slug}`)

  const modules: CourseModuleDetail[] =
    modulesResult.status === 'fulfilled' ? modulesResult.value : []

  const enrollmentId =
    enrollmentResult.status === 'fulfilled' ? (enrollmentResult.value.data?.[0]?.id ?? null) : null

  let completedLessonIds: string[] = []
  if (enrollmentId) {
    const progressRes = await fetch(`${BASE_URL}/enrollments/${enrollmentId}/progress-summary`, {
      headers: authHeaders,
      cache: 'no-store',
    })
    if (progressRes.ok) {
      const progressJson = (await progressRes.json()) as {
        data: { completedLessonIds: string[] }
      }
      completedLessonIds = progressJson?.data?.completedLessonIds ?? []
    }
  }

  // 3. Find the module containing this lesson
  const moduleForLesson = modules.find((m) => m.lessons.some((l) => l.id === lessonId))
  if (!moduleForLesson) notFound()

  // 4. Fetch the lesson detail
  const lessonRes = await fetch(
    `${BASE_URL}/courses/${course.id}/modules/${moduleForLesson.id}/lessons/${lessonId}`,
    { headers: authHeaders, cache: 'no-store' }
  )
  if (lessonRes.status === 404) notFound()
  if (!lessonRes.ok) redirect('/login')
  const { data: lesson } = (await lessonRes.json()) as { data: LessonDetail }

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
    enrollmentResult.status === 'fulfilled' ? enrollmentResult.value.data?.[0] : null
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
      completedLessonIds={completedLessonIds}
      breadcrumb={
        <nav
          aria-label="Breadcrumb"
          className="border-nexus-border hidden border-b px-4 py-2 lg:flex lg:px-6"
        >
          <ol className="text-nexus-muted flex flex-wrap items-center gap-1 text-xs">
            <li>
              <Link
                href="/dashboard"
                className="hover:text-nexus-text flex items-center transition-colors"
                aria-label="Inicio"
              >
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              <Link href="/courses" className="hover:text-nexus-text transition-colors">
                Cursos
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              <Link
                href={`/courses/${course.slug}`}
                className="hover:text-nexus-text transition-colors"
              >
                {course.title}
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="text-nexus-text font-medium" aria-current="page">
                {lesson.title}
              </span>
            </li>
          </ol>
        </nav>
      }
    >
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
          isAlreadyCompleted={completedLessonIds.includes(lessonId)}
          nextLessonHref={nextLesson ? `/courses/${course.slug}/learn/${nextLesson.id}` : null}
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
          isAlreadyCompleted={completedLessonIds.includes(lessonId)}
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
