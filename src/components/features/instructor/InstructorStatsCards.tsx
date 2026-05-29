'use client'

import { BookOpen, Users, CheckCircle2, FileEdit } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface InstructorStatsCardsProps {
  totalCourses: number
  totalStudents: number
  publishedCourses: number
  draftCourses: number
}

interface StatItem {
  label: string
  value: number
  icon: LucideIcon
}

export function InstructorStatsCards({
  totalCourses,
  totalStudents,
  publishedCourses,
  draftCourses,
}: InstructorStatsCardsProps) {
  const stats: StatItem[] = [
    { label: 'Total cursos', value: totalCourses, icon: BookOpen },
    { label: 'Total estudiantes', value: totalStudents, icon: Users },
    { label: 'Cursos publicados', value: publishedCourses, icon: CheckCircle2 },
    { label: 'Cursos en borrador', value: draftCourses, icon: FileEdit },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="border-nexus-border border-l-nexus-accent bg-nexus-card flex items-center gap-4 rounded-xl border border-l-4 p-5"
        >
          <div className="bg-nexus-accent/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Icon className="text-nexus-accent h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-nexus-text text-3xl font-bold tabular-nums">{value}</p>
            <p className="text-nexus-muted text-sm">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
