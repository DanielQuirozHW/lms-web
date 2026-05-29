'use client'

import { useState } from 'react'
import { X, Info, AlertTriangle, Wrench, CheckCircle } from 'lucide-react'
import { useGlobalAnnouncements } from '@/hooks/queries/announcements-global'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { GlobalAnnouncementType } from '@/types/models'

const STORAGE_KEY = 'dismissed_announcements'

const typeConfig: Record<
  GlobalAnnouncementType,
  { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; className: string }
> = {
  INFO: {
    icon: Info,
    className: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  WARNING: {
    icon: AlertTriangle,
    className: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  MAINTENANCE: {
    icon: Wrench,
    className: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  SUCCESS: {
    icon: CheckCircle,
    className: 'bg-nexus-success/10 border-nexus-success/30 text-nexus-success',
  },
}

export function GlobalAnnouncementBanner() {
  const { data: announcements } = useGlobalAnnouncements()
  // Lazy initializer reads sessionStorage once on mount — avoids setState-in-effect pattern
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) return new Set(JSON.parse(stored) as string[])
    } catch {
      // sessionStorage unavailable (e.g. SSR guard)
    }
    return new Set()
  })

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // ignore write errors
      }
      return next
    })
  }

  const visible = (announcements ?? []).filter((a) => a.isActive && !dismissed.has(a.id))

  if (visible.length === 0) return null

  return (
    <div className="flex flex-col">
      {visible.map((a) => {
        const config = typeConfig[a.type]
        const Icon = config.icon
        const canDismiss = a.type !== 'MAINTENANCE'

        return (
          <div
            key={a.id}
            role="alert"
            className={cn('flex items-center gap-3 border-b px-4 py-2.5', config.className)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{a.title}</span>
              {' — '}
              <span>{a.message}</span>
              {a.endsAt && (
                <span className="ml-2 text-xs opacity-75">hasta {formatDate(a.endsAt)}</span>
              )}
            </p>
            {canDismiss && (
              <button
                type="button"
                onClick={() => dismiss(a.id)}
                aria-label="Cerrar alerta"
                className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
