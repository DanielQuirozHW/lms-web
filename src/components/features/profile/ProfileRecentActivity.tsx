'use client'

import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Play,
  MessageSquare,
  CheckCircle2,
  Trophy,
  XCircle,
  Award,
  Megaphone,
  Activity,
  Clock,
} from 'lucide-react'
import { useNotifications } from '@/hooks/queries/notifications'
import { formatRelativeTime } from '@/lib/utils'
import type { NotificationType } from '@/types/models'

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  ENROLLMENT: BookOpen,
  NEW_LESSON: Play,
  FORUM_REPLY: MessageSquare,
  ASSIGNMENT_GRADED: CheckCircle2,
  QUIZ_PASSED: Trophy,
  QUIZ_FAILED: XCircle,
  COURSE_COMPLETED: Award,
  ANNOUNCEMENT: Megaphone,
}

const TYPE_STYLE: Record<NotificationType, { bg: string; color: string }> = {
  ENROLLMENT: { bg: 'rgba(16,185,129,.12)', color: '#10B981' },
  NEW_LESSON: { bg: 'rgba(124,108,255,.14)', color: 'var(--nexus-accent)' },
  FORUM_REPLY: { bg: 'rgba(14,159,217,.14)', color: '#0E9FD9' },
  ASSIGNMENT_GRADED: { bg: 'rgba(16,185,129,.12)', color: '#10B981' },
  QUIZ_PASSED: { bg: 'rgba(234,140,12,.12)', color: '#EA8C0C' },
  QUIZ_FAILED: { bg: 'rgba(229,72,77,.12)', color: '#E5484D' },
  COURSE_COMPLETED: { bg: 'rgba(234,140,12,.12)', color: '#EA8C0C' },
  ANNOUNCEMENT: { bg: 'rgba(124,108,255,.14)', color: '#6D5BF0' },
}

export function ProfileRecentActivity() {
  const { data, isLoading } = useNotifications({ limit: 4 })
  const notifications = data?.data ?? []

  return (
    <div
      className="bg-nexus-card border-nexus-border flex flex-col gap-4 rounded-[22px] border p-5"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
    >
      <div>
        <h2 className="text-nexus-text text-[16px] font-extrabold">Actividad reciente</h2>
        <p className="text-nexus-muted mt-0.5 text-[13px]">Tus últimas acciones en la plataforma</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="bg-nexus-border h-10 w-10 shrink-0 rounded-[11px]" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-nexus-border h-3.5 w-3/4 rounded" />
                <div className="bg-nexus-border h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Activity className="text-nexus-faint h-8 w-8" aria-hidden="true" />
          <p className="text-nexus-muted text-sm">Sin actividad reciente</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type]
            const style = TYPE_STYLE[n.type]
            return (
              <li key={n.id} className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: style.bg }}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    style={{ color: style.color }}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-nexus-text line-clamp-2 text-[13.5px] leading-snug">
                    {n.title}
                  </p>
                  <div className="text-nexus-muted mt-1 flex items-center gap-1 text-[12px]">
                    <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <time dateTime={n.createdAt}>{formatRelativeTime(n.createdAt)}</time>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
