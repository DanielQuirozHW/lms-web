'use client'

import { useEffect } from 'react'
import { useNotificationsStore } from '@/store/notifications.store'

interface NotificationsSyncProps {
  unreadCount: number
}

// Syncs the server-fetched notification count to the Zustand store so the
// header bell badge reflects reality on every dashboard visit.
export function NotificationsSync({ unreadCount }: NotificationsSyncProps) {
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount)

  useEffect(() => {
    setUnreadCount(unreadCount)
  }, [unreadCount, setUnreadCount])

  return null
}
