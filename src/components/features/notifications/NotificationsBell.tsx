'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award,
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Clock,
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

// Arbitrary-value Tailwind classes — matches reference color palette, dark-mode aware
const TYPE_STYLE: Record<NotificationType, string> = {
  ENROLLMENT: 'bg-[#E8F7EE] text-[#10B981] dark:bg-[rgba(34,197,94,0.14)] dark:text-[#34D89E]',
  NEW_LESSON: 'bg-nexus-accent-muted text-nexus-accent',
  FORUM_REPLY: 'bg-[#E4F5FD] text-[#0E9FD9] dark:bg-[rgba(14,159,217,0.16)] dark:text-[#46C2F0]',
  ASSIGNMENT_GRADED:
    'bg-[#E8F7EE] text-[#10B981] dark:bg-[rgba(34,197,94,0.14)] dark:text-[#34D89E]',
  QUIZ_PASSED: 'bg-[#FEF1E2] text-[#E8920C] dark:bg-[rgba(234,140,12,0.16)] dark:text-[#F5B14D]',
  QUIZ_FAILED: 'bg-[#FDECEA] text-[#E5484D] dark:bg-[rgba(229,72,77,0.12)] dark:text-[#FF6B6F]',
  COURSE_COMPLETED:
    'bg-[#FEF1E2] text-[#E8920C] dark:bg-[rgba(234,140,12,0.16)] dark:text-[#F5B14D]',
  ANNOUNCEMENT: 'bg-[#EFEDFE] text-[#6D5BF0] dark:bg-[rgba(124,108,255,0.16)] dark:text-[#A99CFF]',
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
          className="bg-nexus-card border-nexus-border absolute top-[calc(100%+12px)] right-0 z-50 w-[360px] overflow-hidden rounded-[18px] border"
          style={{ boxShadow: 'var(--nexus-menu-shadow)' }}
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          {/* Header */}
          <div className="border-nexus-border flex items-center justify-between border-b px-[18px] py-4">
            <div className="flex items-center gap-[9px]">
              <span className="text-nexus-text text-[15px] font-extrabold">Notificaciones</span>
              {unreadCount > 0 && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#7C6CFF,#6D5BF0)' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-nexus-accent text-[12.5px] font-bold transition-opacity hover:underline disabled:opacity-50"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* Notification rows */}
          <div className="max-h-[340px] overflow-y-auto">
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

          {/* Footer — ghost bordered button */}
          <div className="px-[18px] py-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push('/notifications')
              }}
              className="border-nexus-border text-nexus-text hover:bg-nexus-menu-hover w-full rounded-[11px] border bg-transparent px-[11px] py-[11px] text-[13.5px] font-bold transition-colors"
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
        'border-nexus-border hover:bg-nexus-menu-hover flex cursor-pointer items-start gap-3 border-b px-[18px] py-[13px] transition-colors',
        !n.isRead && 'bg-nexus-unread-row'
      )}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleActivate()
      }}
    >
      {/* Icon container — 38×38, border-radius 11 */}
      <div
        className={cn(
          'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px]',
          iconStyle
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-nexus-text text-[13.5px] leading-[1.45]" style={{ lineHeight: 1.45 }}>
          {n.title}
        </p>
        {n.body && n.body !== n.title && (
          <p className="text-nexus-muted mt-0.5 line-clamp-1 text-xs">{n.body}</p>
        )}
        <div className="text-nexus-muted mt-[3px] flex items-center gap-[5px] text-[12px]">
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
          <time dateTime={n.createdAt}>{formatRelativeTime(n.createdAt)}</time>
        </div>
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div
          className="bg-nexus-accent mt-[6px] h-2 w-2 shrink-0 rounded-full"
          aria-hidden="true"
        />
      )}
    </li>
  )
}
