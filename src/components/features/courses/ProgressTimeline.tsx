'use client'

import {
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { LessonType } from '@/types/models'
import type { ModuleWithLessons } from '@/hooks/queries/modules'

const lessonTypeIcon: Record<
  LessonType,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
}

interface ProgressTimelineProps {
  modules: ModuleWithLessons[]
  completedLessonIds: string[]
  // Optional map of lessonId → ISO completedAt string for accurate timestamps
  lessonCompletedAt?: Record<string, string>
}

export function ProgressTimeline({
  modules,
  completedLessonIds,
  lessonCompletedAt = {},
}: ProgressTimelineProps) {
  const completedSet = new Set(completedLessonIds)

  // Collect completed lessons in order, grouped by module
  const completedByModule = modules
    .map((module) => ({
      module,
      lessons: module.lessons.filter((l) => completedSet.has(l.id)),
    }))
    .filter((g) => g.lessons.length > 0)

  if (completedByModule.length === 0) {
    return (
      <div className="border-nexus-border flex flex-col items-center gap-2 rounded-xl border py-12 text-center">
        <BookOpen className="text-nexus-muted/40 h-8 w-8" aria-hidden="true" />
        <p className="text-nexus-muted text-sm">Todavía no completaste ninguna lección</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {completedByModule.map(({ module, lessons }) => (
        <div key={module.id}>
          {/* Module heading */}
          <h3 className="text-nexus-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            {module.title}
          </h3>

          {/* Lesson entries */}
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="bg-nexus-border absolute top-4 left-[15px] w-px"
              style={{ height: `calc(100% - 16px)` }}
              aria-hidden="true"
            />

            <ul className="space-y-3">
              {lessons.map((lesson) => {
                const Icon = lessonTypeIcon[lesson.type]
                const completedAt = lessonCompletedAt[lesson.id]

                return (
                  <li key={lesson.id} className="relative flex items-start gap-3 pl-1">
                    {/* Circle indicator */}
                    <div
                      className="bg-nexus-success relative z-10 mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                      aria-hidden="true"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-0.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="text-nexus-muted h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="text-nexus-text truncate text-sm font-medium">
                            {lesson.title}
                          </span>
                        </div>
                      </div>

                      {completedAt && (
                        <time
                          dateTime={completedAt}
                          className={cn('text-nexus-muted shrink-0 text-xs')}
                          title={new Date(completedAt).toLocaleString('es-AR')}
                        >
                          {formatRelativeTime(completedAt)}
                        </time>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
