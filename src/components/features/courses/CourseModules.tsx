'use client'

import { useState } from 'react'
import { ChevronDown, PlayCircle, FileText, HelpCircle, ClipboardList, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import type { CourseModuleDetail, LessonSummary, LessonType } from '@/types/models'

const lessonIcon: Record<LessonType, React.ElementType> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
}

interface CourseModulesProps {
  modules: CourseModuleDetail[]
  isEnrolled: boolean
}

function LessonRow({ lesson, isEnrolled }: { lesson: LessonSummary; isEnrolled: boolean }) {
  const Icon = lessonIcon[lesson.type]
  const isLocked = !lesson.isPreview && !isEnrolled

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Icon
        className={cn('h-4 w-4 shrink-0', isLocked ? 'text-nexus-muted' : 'text-nexus-accent')}
        aria-hidden="true"
      />
      <span
        className={cn('flex-1 truncate text-sm', isLocked ? 'text-nexus-muted' : 'text-nexus-text')}
      >
        {lesson.title}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        {lesson.isPreview && !isEnrolled && (
          <span className="bg-nexus-accent/15 text-nexus-accent rounded-full px-2 py-0.5 text-[10px] font-semibold">
            Vista previa
          </span>
        )}
        {lesson.duration != null && lesson.duration > 0 && (
          <span className="text-nexus-muted text-xs">{formatDuration(lesson.duration)}</span>
        )}
        {isLocked && (
          <Lock className="text-nexus-muted h-3.5 w-3.5" aria-label="Lección bloqueada" />
        )}
      </div>
    </li>
  )
}

export function CourseModules({ modules, isEnrolled }: CourseModulesProps) {
  // Open the first module by default
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(modules[0] ? [modules[0].id] : [])
  )

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (modules.length === 0) {
    return <p className="text-nexus-muted text-sm">Este curso aún no tiene módulos publicados.</p>
  }

  return (
    <div className="space-y-2" role="list" aria-label="Módulos del curso">
      {modules.map((module) => {
        const isOpen = openIds.has(module.id)
        const totalDuration = module.lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0)

        return (
          <div
            key={module.id}
            role="listitem"
            className="border-nexus-border bg-nexus-card overflow-hidden rounded-xl border"
          >
            {/* Module header — toggle button */}
            <button
              type="button"
              onClick={() => toggle(module.id)}
              aria-expanded={isOpen}
              className="hover:bg-nexus-bg/50 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
            >
              <ChevronDown
                className={cn(
                  'text-nexus-muted h-4 w-4 shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
              <span className="text-nexus-text flex-1 text-sm font-semibold">{module.title}</span>
              <span className="text-nexus-muted shrink-0 text-xs">
                {module.lessons.length} lección{module.lessons.length !== 1 && 'es'}
                {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
              </span>
            </button>

            {/* Lessons list */}
            {isOpen && module.lessons.length > 0 && (
              <ul className="border-nexus-border border-t">
                {module.lessons.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} isEnrolled={isEnrolled} />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
