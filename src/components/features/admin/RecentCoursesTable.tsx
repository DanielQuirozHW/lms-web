'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { CourseStatus } from '@/types/models'
import type { CatalogCourse } from '@/components/features/courses/CourseCard'

const statusConfig: Record<CourseStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Borrador',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  PUBLISHED: {
    label: 'Publicado',
    className: 'bg-nexus-success/15 text-nexus-success',
  },
  ARCHIVED: {
    label: 'Archivado',
    className: 'bg-nexus-muted/10 text-nexus-muted',
  },
}

interface RecentCoursesTableProps {
  courses: CatalogCourse[]
}

export function RecentCoursesTable({ courses }: RecentCoursesTableProps) {
  return (
    <div className="border-nexus-border bg-nexus-card rounded-xl border">
      {/* Header */}
      <div className="border-nexus-border flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-nexus-text text-base font-semibold">Cursos recientes</h2>
        <Link
          href="/admin/courses"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-nexus-muted hover:text-nexus-text text-xs',
          })}
        >
          Ver todos →
        </Link>
      </div>

      {courses.length === 0 ? (
        <p className="text-nexus-muted px-5 py-8 text-center text-sm">Sin cursos registrados</p>
      ) : (
        <ul>
          {courses.map((course, i) => {
            const instructorName = course.instructor
              ? `${course.instructor.firstName} ${course.instructor.lastName}`
              : null
            const statusCfg = statusConfig[course.status]

            return (
              <li
                key={course.id}
                className={cn(
                  'flex items-center gap-3 px-5 py-3',
                  i < courses.length - 1 && 'border-nexus-border border-b'
                )}
              >
                {/* Thumbnail */}
                <div className="bg-nexus-bg relative h-10 w-16 shrink-0 overflow-hidden rounded-md">
                  {course.coverUrl ? (
                    <Image
                      src={course.coverUrl}
                      alt={course.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="text-nexus-muted/40 h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Title + instructor */}
                <div className="min-w-0 flex-1">
                  <p className="text-nexus-text line-clamp-1 text-sm font-medium">{course.title}</p>
                  {instructorName && (
                    <p className="text-nexus-muted truncate text-xs">{instructorName}</p>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    'hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline',
                    statusCfg.className
                  )}
                >
                  {statusCfg.label}
                </span>

                {/* Created date */}
                <time
                  dateTime={course.createdAt}
                  className="text-nexus-muted hidden shrink-0 text-xs lg:block"
                  title={course.createdAt}
                >
                  {formatDate(course.createdAt)}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
