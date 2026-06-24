'use client'

import { useState } from 'react'
import Link from 'next/link'
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

const lessonTypeLabel: Record<LessonType, string> = {
  VIDEO: 'Video',
  TEXT: 'Lectura',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Tarea',
}

interface CourseModulesProps {
  modules: CourseModuleDetail[]
  isEnrolled: boolean
  courseId: string
}

function LessonRow({
  lesson,
  isEnrolled,
  courseId,
}: {
  lesson: LessonSummary
  isEnrolled: boolean
  courseId: string
}) {
  const Icon = lessonIcon[lesson.type]
  const isLocked = !lesson.isPreview && !isEnrolled
  const href = `/courses/${courseId}/learn/${lesson.id}`

  const iconContainerStyle = isLocked
    ? { background: 'var(--nexus-nav-hover)', color: 'var(--nexus-muted)' }
    : { background: 'var(--nexus-accent-muted)', color: 'var(--nexus-accent)' }

  const rowContent = (
    <>
      {/* Type icon container */}
      <span
        className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px]"
        style={iconContainerStyle}
        aria-hidden="true"
      >
        <Icon className="h-4.5 w-4.5" />
      </span>

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1">
        <div
          className={cn('truncate text-sm leading-snug font-semibold', {
            'text-nexus-muted': isLocked,
            'text-nexus-text': !isLocked,
          })}
        >
          {lesson.title}
        </div>
        <div className="text-nexus-faint mt-0.5 text-xs">
          {lessonTypeLabel[lesson.type]}
          {lesson.duration != null && lesson.duration > 0
            ? ` · ${formatDuration(lesson.duration)}`
            : ''}
        </div>
      </div>

      {/* Right badges */}
      <div className="flex shrink-0 items-center gap-2">
        {lesson.isPreview && !isEnrolled && (
          <span className="bg-nexus-accent/15 text-nexus-accent rounded-full px-2 py-0.5 text-[10px] font-semibold">
            Vista previa
          </span>
        )}
        {isLocked && (
          <Lock className="text-nexus-muted h-3.5 w-3.5" aria-label="Lección bloqueada" />
        )}
      </div>
    </>
  )

  const rowBase = 'flex h-13 items-center gap-3.5 px-4.5'
  const borderClass = 'border-b border-nexus-border last:border-b-0'

  if (isLocked) {
    return <li className={cn(rowBase, borderClass)}>{rowContent}</li>
  }

  return (
    <li className={borderClass}>
      <Link
        href={href}
        className={cn(rowBase, 'hover:bg-nexus-nav-hover w-full transition-colors')}
      >
        {rowContent}
      </Link>
    </li>
  )
}

export function CourseModules({ modules, isEnrolled, courseId }: CourseModulesProps) {
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
    <div className="flex flex-col gap-3.5" role="list" aria-label="Módulos del curso">
      {modules.map((module, moduleIndex) => {
        const isOpen = openIds.has(module.id)
        const lessons = module.lessons ?? []
        const totalDuration = lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0)

        return (
          <div
            key={module.id}
            role="listitem"
            className="border-nexus-border bg-nexus-card overflow-hidden rounded-[15px] border"
            style={{ boxShadow: 'var(--nexus-card-shadow)' }}
          >
            {/* Module header */}
            <button
              type="button"
              onClick={() => toggle(module.id)}
              aria-expanded={isOpen}
              className="hover:bg-nexus-bg/50 flex w-full items-center gap-3.5 px-4.5 py-4.25 text-left transition-colors"
            >
              <ChevronDown
                className={cn(
                  'text-nexus-muted h-4.5 w-4.5 shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />

              {/* Module number badge */}
              <span
                className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-extrabold"
                style={{ background: 'var(--nexus-accent-muted)', color: 'var(--nexus-accent)' }}
                aria-hidden="true"
              >
                {moduleIndex + 1}
              </span>

              <span className="text-nexus-text flex-1 text-[15.5px] font-bold">{module.title}</span>

              <span className="text-nexus-muted shrink-0 text-[12.5px] font-semibold">
                {lessons.length} lección{lessons.length !== 1 ? 'es' : ''}
                {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
              </span>
            </button>

            {/* Lessons list */}
            {isOpen && lessons.length > 0 && (
              <ul className="border-nexus-border border-t">
                {lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    isEnrolled={isEnrolled}
                    courseId={courseId}
                  />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
