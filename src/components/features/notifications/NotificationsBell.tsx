'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award,
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  Play,
  Trophy,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNotificationsStore } from '@/store/notifications.store'
import { useNotifications } from '@/hooks/queries/notifications'
import { useMarkAllReadMutation } from '@/hooks/mutations/notifications'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/models'

const ICONBTN =
  'flex h-10.5 w-10.5 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border-none bg-nexus-iconbtn text-nexus-iconbtn-fg transition-colors duration-150 hover:bg-nexus-iconbtn-hover hover:text-nexus-iconbtn-hover-fg focus-visible:outline-none'

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

const TYPE_STYLE: Record<NotificationType, string> = {
  ENROLLMENT: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  NEW_LESSON: 'bg-nexus-accent-muted text-nexus-accent',
  FORUM_REPLY: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  ASSIGNMENT_GRADED: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  QUIZ_PASSED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  QUIZ_FAILED: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  COURSE_COMPLETED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  ANNOUNCEMENT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
}

export function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const { data, isLoading } = useNotifications({ limit: 5 })
  const markAllRead = useMarkAllReadMutation()

  useEffect(() => {
    if (!open) return
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const notifications = data?.data ?? []

  return (
    <div ref={wrapperRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(ICONBTN, 'relative')}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[19px] w-[19px]" />
        {unreadCount > 0 && (
          <span
            className="absolute top-[9px] right-[10px] h-[9px] w-[9px] rounded-full border-2 bg-[#F5544E]"
            style={{ borderColor: 'var(--nexus-iconbtn-bg)' }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="bg-nexus-card border-nexus-border absolute top-[calc(100%+12px)] right-0 z-50 flex w-[360px] flex-col overflow-hidden rounded-[18px] border shadow-xl shadow-black/10 dark:shadow-black/30"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          {/* Panel header */}
          <div className="border-nexus-border flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-nexus-text text-sm font-bold">Notificaciones</span>
              {unreadCount > 0 && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white"
                  style={{ background: 'var(--nexus-nav-active-gradient)' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-nexus-accent hover:text-nexus-accent-hover text-xs font-medium transition-colors disabled:opacity-50"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* Notification rows */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="border-nexus-accent h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8">
                <BellOff className="text-nexus-faint h-8 w-8" aria-hidden="true" />
                <p className="text-nexus-muted text-sm">Sin notificaciones</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} onClose={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-nexus-border border-t px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push('/notifications')
              }}
              className="text-nexus-accent hover:text-nexus-accent-hover w-full py-1 text-center text-sm font-medium transition-colors"
            >
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationRow({
  notification: n,
  onClose,
}: {
  notification: Notification
  onClose: () => void
}) {
  const router = useRouter()
  const Icon = TYPE_ICON[n.type]
  const iconStyle = TYPE_STYLE[n.type]

  function handleActivate() {
    onClose()
    router.push('/notifications')
  }

  return (
    <li
      className={cn(
        'hover:bg-nexus-border/40 flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
        !n.isRead && 'bg-nexus-unread-row'
      )}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleActivate()
      }}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          iconStyle
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-nexus-text line-clamp-1 text-[13px] font-semibold">{n.title}</p>
        <p className="text-nexus-muted mt-0.5 line-clamp-2 text-xs">{n.body}</p>
        <time dateTime={n.createdAt} className="text-nexus-faint mt-1 block text-[11px]">
          {formatRelativeTime(n.createdAt)}
        </time>
      </div>

      {!n.isRead && (
        <div className="bg-nexus-accent mt-1.5 h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
      )}
    </li>
  )
}
