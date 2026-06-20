'use client'

import { BookOpen, CheckCircle2, CalendarDays } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardsProps {
  activeEnrollments: number
  completedLessons: number
  upcomingEvents: number
}

interface StatConfig {
  icon: LucideIcon
  label: string
  iconBg: string
  iconColor: string
  badgeColor: string
  badgeBg: string
}

const STAT_CONFIGS: StatConfig[] = [
  {
    icon: BookOpen,
    label: 'Cursos en progreso',
    iconBg: 'var(--nexus-stat-1-bg)',
    iconColor: 'var(--nexus-stat-1-color)',
    badgeColor: 'var(--nexus-green)',
    badgeBg: 'var(--nexus-green-bg)',
  },
  {
    icon: CheckCircle2,
    label: 'Lecciones completadas',
    iconBg: 'var(--nexus-stat-2-bg)',
    iconColor: 'var(--nexus-stat-2-color)',
    badgeColor: 'var(--nexus-green)',
    badgeBg: 'var(--nexus-green-bg)',
  },
  {
    icon: CalendarDays,
    label: 'Próximos eventos',
    iconBg: 'var(--nexus-stat-3-bg)',
    iconColor: 'var(--nexus-stat-3-color)',
    badgeColor: 'var(--nexus-orange)',
    badgeBg: 'var(--nexus-orange-bg)',
  },
]

export function StatsCards({
  activeEnrollments,
  completedLessons,
  upcomingEvents,
}: StatsCardsProps) {
  const values = [activeEnrollments, completedLessons, upcomingEvents]
  const badges = [`+${activeEnrollments}`, `+${completedLessons} sem.`, 'esta sem.']

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3">
      {STAT_CONFIGS.map((cfg, i) => {
        const Icon = cfg.icon
        return (
          <div
            key={cfg.label}
            className="border-nexus-border bg-nexus-card flex flex-col gap-[14px] rounded-[18px] border p-5"
            style={{ boxShadow: 'var(--nexus-card-shadow)' }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px]"
                style={{ background: cfg.iconBg, color: cfg.iconColor }}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <span
                className="rounded-full px-[10px] py-1 text-xs font-bold"
                style={{ color: cfg.badgeColor, background: cfg.badgeBg }}
              >
                {badges[i]}
              </span>
            </div>
            <div>
              <p
                className="text-nexus-text leading-none font-extrabold tracking-[-0.02em]"
                style={{ fontSize: '34px' }}
              >
                {values[i]}
              </p>
              <p className="text-nexus-muted mt-[5px] text-[14px]">{cfg.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
