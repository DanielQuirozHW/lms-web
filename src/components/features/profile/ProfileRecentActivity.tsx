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
  ENROLLMENT: { bg: 'var(--nexus-green-bg)', color: 'var(--nexus-green)' },
  NEW_LESSON: { bg: 'var(--chip-0-bg)', color: 'var(--chip-0-color)' },
  FORUM_REPLY: { bg: 'var(--chip-2-bg)', color: 'var(--chip-2-color)' },
  ASSIGNMENT_GRADED: { bg: 'var(--nexus-green-bg)', color: 'var(--nexus-green)' },
  QUIZ_PASSED: { bg: 'var(--chip-1-bg)', color: 'var(--chip-1-color)' },
  QUIZ_FAILED: { bg: 'rgba(229,72,77,.12)', color: '#E5484D' },
  COURSE_COMPLETED: { bg: 'var(--chip-1-bg)', color: 'var(--chip-1-color)' },
  ANNOUNCEMENT: { bg: 'var(--chip-0-bg)', color: 'var(--chip-0-color)' },
}

export function ProfileRecentActivity() {
  const { data, isLoading } = useNotifications({ limit: 4 })
  const notifications = data?.data ?? []

  return (
    <div
      className="bg-nexus-card border-nexus-border rounded-[18px] border p-[22px]"
      style={{ boxShadow: 'var(--nexus-card-shadow)' }}
    >
      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)', marginBottom: 6 }}>
        Actividad reciente
      </div>

      {isLoading ? (
        <div>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-start gap-[13px]"
              style={{ padding: '13px 0', borderBottom: '1px solid var(--nexus-border)' }}
            >
              <div className="bg-nexus-border h-9 w-9 shrink-0 rounded-[10px]" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="bg-nexus-border h-3.5 w-3/4 rounded" />
                <div className="bg-nexus-border h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Activity className="text-nexus-faint h-8 w-8" aria-hidden="true" />
          <p className="text-nexus-faint text-sm">Sin actividad reciente</p>
        </div>
      ) : (
        <div>
          {notifications.map((n, idx) => {
            const Icon = TYPE_ICON[n.type]
            const style = TYPE_STYLE[n.type]
            const isLast = idx === notifications.length - 1
            return (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: 13,
                  alignItems: 'flex-start',
                  padding: '13px 0',
                  borderBottom: isLast ? 'none' : '1px solid var(--nexus-border)',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: style.bg,
                    color: style.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    style={{ width: 17, height: 17, display: 'block', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                </span>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--nexus-text)',
                      lineHeight: 1.4,
                    }}
                  >
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--nexus-faint)', marginTop: 2 }}>
                    <time dateTime={n.createdAt}>{formatRelativeTime(n.createdAt)}</time>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
