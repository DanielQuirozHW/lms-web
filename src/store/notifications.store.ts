import { create } from 'zustand'
import type { Notification } from '@/types/models'

interface NotificationsState {
  unreadCount: number
  recentNotifications: Notification[]
  setUnreadCount: (count: number) => void
  addNotification: (notification: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  recentNotifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) =>
    set((state) => ({
      recentNotifications: [notification, ...state.recentNotifications].slice(0, 20),
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    })),

  markRead: (id) =>
    set((state) => ({
      recentNotifications: state.recentNotifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      recentNotifications: state.recentNotifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}))
