'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LessonSidebar } from './LessonSidebar'
import type { CourseModuleDetail } from '@/types/models'

interface LessonPageShellProps {
  courseId: string
  courseTitle: string
  modules: CourseModuleDetail[]
  activeLessonId: string
  progressPercentage: number
  completedLessonIds: string[]
  children: React.ReactNode
  breadcrumb?: React.ReactNode
}

export function LessonPageShell({
  courseId,
  courseTitle,
  modules,
  activeLessonId,
  progressPercentage,
  completedLessonIds,
  children,
  breadcrumb,
}: LessonPageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="-m-4 -mb-20 flex h-[calc(100dvh-56px)] overflow-hidden lg:-m-6 lg:-mb-6">
      {/* Sidebar */}
      <LessonSidebar
        courseId={courseId}
        courseTitle={courseTitle}
        modules={modules}
        activeLessonId={activeLessonId}
        progressPercentage={progressPercentage}
        completedLessonIds={completedLessonIds}
        mobileOpen={sidebarOpen}
        onMobileOpenChange={setSidebarOpen}
      />

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="border-nexus-border bg-nexus-surface flex items-center gap-2 border-b px-3 py-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-nexus-muted hover:text-nexus-text shrink-0"
            aria-label="Abrir índice del curso"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <span className="text-nexus-text truncate text-sm font-medium">{courseTitle}</span>
        </div>

        {/* Static breadcrumb slot — rendered server-side, no Zustand dependency */}
        {breadcrumb}

        {/* Scrollable lesson content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
