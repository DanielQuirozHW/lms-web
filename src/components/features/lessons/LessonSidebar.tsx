'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  CheckCircle,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import type { CourseModuleDetail, LessonSummary, LessonType } from '@/types/models'

const lessonIcon: Record<LessonType, React.ElementType> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
}

export interface LessonSidebarProps {
  courseId: string
  courseTitle: string
  modules: CourseModuleDetail[]
  activeLessonId: string
  progressPercentage: number
  completedLessonIds: string[]
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

function SidebarContent({
  courseId,
  courseTitle,
  modules,
  activeLessonId,
  progressPercentage,
  completedLessonIds,
  onNavigate,
}: Omit<LessonSidebarProps, 'mobileOpen' | 'onMobileOpenChange'> & {
  onNavigate?: () => void
}) {
  // Open the module containing the active lesson by default
  const activeModuleId = modules.find((m) => m.lessons.some((l) => l.id === activeLessonId))?.id

  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(activeModuleId ? [activeModuleId] : modules[0] ? [modules[0].id] : [])
  )

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pct = Math.round(progressPercentage)

  return (
    <div className="flex h-full flex-col">
      {/* Header + progress */}
      <div className="border-nexus-border border-b p-4">
        <Link
          href={`/courses/${courseId}`}
          className="text-nexus-text hover:text-nexus-accent mb-3 block truncate text-sm font-semibold transition-colors"
          onClick={onNavigate}
        >
          {courseTitle}
        </Link>
        {/* Overall progress bar */}
        <div className="space-y-1">
          <div
            className="bg-nexus-border h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del curso: ${pct}%`}
          >
            <div
              className="bg-nexus-accent h-full rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-nexus-muted text-[10px]">{pct}% completado</p>
        </div>
      </div>

      {/* Modules accordion */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {modules.map((module) => {
            const isOpen = openIds.has(module.id)
            return (
              <div key={module.id}>
                <button
                  type="button"
                  onClick={() => toggle(module.id)}
                  aria-expanded={isOpen}
                  className="text-nexus-muted hover:bg-nexus-card hover:text-nexus-text flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold tracking-wide uppercase transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{module.title}</span>
                </button>

                {isOpen && (
                  <ul className="mt-0.5 space-y-0.5 pb-1">
                    {module.lessons
                      .filter((l) => l.isPublished)
                      .map((lesson: LessonSummary) => {
                        const Icon = lessonIcon[lesson.type]
                        const isActive = lesson.id === activeLessonId
                        const isCompleted = completedLessonIds.includes(lesson.id)

                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/courses/${courseId}/learn/${lesson.id}`}
                              onClick={onNavigate}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                isActive
                                  ? 'bg-nexus-accent-muted text-nexus-accent font-medium'
                                  : 'text-nexus-muted hover:bg-nexus-card hover:text-nexus-text'
                              )}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="flex-1 truncate text-xs leading-relaxed">
                                {lesson.title}
                              </span>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {lesson.duration != null && lesson.duration > 0 && (
                                  <span className="text-nexus-muted text-[10px]">
                                    {formatDuration(lesson.duration)}
                                  </span>
                                )}
                                {isCompleted && (
                                  <CheckCircle
                                    className="text-nexus-success h-3.5 w-3.5"
                                    aria-label="Completada"
                                  />
                                )}
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

export function LessonSidebar({
  mobileOpen,
  onMobileOpenChange,
  ...contentProps
}: LessonSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="border-nexus-border bg-nexus-surface hidden w-[280px] shrink-0 border-r lg:flex lg:flex-col">
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-nexus-surface border-nexus-border w-[280px] p-0">
          <SheetTitle className="sr-only">Contenido del curso</SheetTitle>
          <SidebarContent {...contentProps} onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
