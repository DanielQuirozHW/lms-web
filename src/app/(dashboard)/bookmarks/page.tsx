import type { Metadata } from 'next'
import Link from 'next/link'
import { Bookmark, PlayCircle, FileText, HelpCircle, ClipboardList, BookOpen } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { Bookmark as BookmarkType, LessonType } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Guardados | NexusLMS',
  description: 'Tus lecciones guardadas en NexusLMS.',
  openGraph: {
    title: 'Guardados | NexusLMS',
    description: 'Tus lecciones guardadas en NexusLMS.',
    type: 'website',
  },
}

const lessonTypeIcon: Record<
  LessonType,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
}

const lessonTypeLabel: Record<LessonType, string> = {
  VIDEO: 'Video',
  TEXT: 'Lectura',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Tarea',
}

export default async function BookmarksPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let bookmarks: BookmarkType[] = []
  try {
    const r = await api.get<PaginatedData<BookmarkType>>('/bookmarks', {
      params: { limit: 50 },
      headers,
    })
    bookmarks = r.data.data ?? []
  } catch {
    // Render empty state on error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Guardados</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {bookmarks.length} lección{bookmarks.length !== 1 && 'es'} guardada
          {bookmarks.length !== 1 && 's'}
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="border-nexus-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <div className="bg-nexus-muted/10 flex h-14 w-14 items-center justify-center rounded-full">
            <Bookmark className="text-nexus-muted h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-nexus-text font-medium">No guardaste ninguna lección todavía</p>
            <p className="text-nexus-muted mt-1 text-sm">
              Guardá lecciones mientras aprendés para encontrarlas fácilmente.
            </p>
          </div>
          <Link
            href="/courses"
            className="text-nexus-accent hover:text-nexus-accent-hover text-sm font-medium transition-colors"
          >
            Explorar cursos
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => {
            const lesson = bookmark.lesson
            const Icon = lessonTypeIcon[lesson.type] ?? BookOpen
            const courseTitle = lesson.course?.title ?? 'Curso'
            const courseId = lesson.course?.id ?? lesson.courseId
            const href = `/courses/${courseId}/learn/${lesson.id}`

            return (
              <div
                key={bookmark.id}
                className="border-nexus-border bg-nexus-card flex flex-col gap-3 rounded-xl border p-4"
              >
                {/* Type badge + date */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'bg-nexus-accent/10 text-nexus-accent inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold'
                    )}
                  >
                    <Icon className="h-3 w-3" aria-hidden />
                    {lessonTypeLabel[lesson.type]}
                  </span>
                  <time
                    dateTime={bookmark.createdAt}
                    className="text-nexus-muted shrink-0 text-[11px]"
                  >
                    {formatDate(bookmark.createdAt)}
                  </time>
                </div>

                {/* Lesson title */}
                <p className="text-nexus-text line-clamp-2 text-sm leading-snug font-semibold">
                  {lesson.title}
                </p>

                {/* Course name */}
                <p className="text-nexus-muted truncate text-xs">{courseTitle}</p>

                <div className="flex-1" />

                {/* CTA */}
                <Link
                  href={href}
                  className="bg-nexus-accent hover:bg-nexus-accent-hover flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Ir a la lección
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
