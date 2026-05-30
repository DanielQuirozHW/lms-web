import { create } from 'zustand'

interface MessagesState {
  messagesUnreadCount: number
  setMessagesUnreadCount: (count: number) => void
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messagesUnreadCount: 0,
  setMessagesUnreadCount: (count) => set({ messagesUnreadCount: count }),
}))
