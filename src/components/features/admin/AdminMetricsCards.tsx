import { Users, BookOpen, CheckCircle2, FileText, Archive, Bell } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCard {
  label: string
  value: number
  icon: LucideIcon
  borderColor: string
  bgColor: string
  iconColor: string
}

export interface AdminMetricsCardsProps {
  totalUsers: number
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  activeAlerts: number
}

export function AdminMetricsCards({
  totalUsers,
  totalCourses,
  publishedCourses,
  draftCourses,
  archivedCourses,
  activeAlerts,
}: AdminMetricsCardsProps) {
  const cards: MetricCard[] = [
    {
      label: 'Total usuarios',
      value: totalUsers,
      icon: Users,
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Total cursos',
      value: totalCourses,
      icon: BookOpen,
      borderColor: 'border-l-nexus-accent',
      bgColor: 'bg-nexus-accent/15',
      iconColor: 'text-nexus-accent',
    },
    {
      label: 'Cursos publicados',
      value: publishedCourses,
      icon: CheckCircle2,
      borderColor: 'border-l-nexus-success',
      bgColor: 'bg-nexus-success/15',
      iconColor: 'text-nexus-success',
    },
    {
      label: 'Cursos en borrador',
      value: draftCourses,
      icon: FileText,
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Cursos archivados',
      value: archivedCourses,
      icon: Archive,
      borderColor: 'border-l-nexus-muted',
      bgColor: 'bg-nexus-muted/10',
      iconColor: 'text-nexus-muted',
    },
    {
      label: 'Alertas activas',
      value: activeAlerts,
      icon: Bell,
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-500/15',
      iconColor: 'text-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, borderColor, bgColor, iconColor }) => (
        <div
          key={label}
          className={`border-nexus-border bg-nexus-card flex items-center gap-4 rounded-xl border border-l-4 p-5 ${borderColor}`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bgColor}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
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
