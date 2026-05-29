'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LessonInfo {
  id: string
  title: string
}

interface LessonNavigationProps {
  courseId: string
  prevLesson: LessonInfo | null
  nextLesson: LessonInfo | null
  // When true, the current lesson has a quiz/assignment that must be completed before advancing
  blocksProgress: boolean
}

export function LessonNavigation({
  courseId,
  prevLesson,
  nextLesson,
  blocksProgress,
}: LessonNavigationProps) {
  const nextBlocked = blocksProgress && !!nextLesson

  return (
    <nav
      className="border-nexus-border flex items-center justify-between gap-4 border-t pt-6"
      aria-label="Navegación entre lecciones"
    >
      {/* Previous */}
      {prevLesson ? (
        <Link
          href={`/courses/${courseId}/learn/${prevLesson.id}`}
          className={buttonVariants({
            variant: 'outline',
            className:
              'border-nexus-border text-nexus-muted hover:text-nexus-text flex items-center gap-2',
          })}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden max-w-[140px] truncate sm:inline">{prevLesson.title}</span>
          <span className="sm:hidden">Anterior</span>
        </Link>
      ) : (
        <div /> /* spacer */
      )}

      {/* Next */}
      {nextLesson ? (
        nextBlocked ? (
          <span
            className={cn(
              buttonVariants({
                className: 'flex cursor-not-allowed items-center gap-2 opacity-50',
              }),
              'pointer-events-none'
            )}
            aria-disabled="true"
            title="Completá la actividad para continuar"
          >
            <span className="hidden max-w-[140px] truncate sm:inline">{nextLesson.title}</span>
            <span className="sm:hidden">Siguiente</span>
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          </span>
        ) : (
          <Link
            href={`/courses/${courseId}/learn/${nextLesson.id}`}
            className={buttonVariants({
              className:
                'bg-nexus-accent hover:bg-nexus-accent-hover flex items-center gap-2 text-white',
            })}
          >
            <span className="hidden max-w-[140px] truncate sm:inline">{nextLesson.title}</span>
            <span className="sm:hidden">Siguiente</span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        )
      ) : (
        <div className="text-nexus-success text-sm font-medium">🎉 Fin del módulo</div>
      )}
    </nav>
  )
}
