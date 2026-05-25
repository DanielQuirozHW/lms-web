import { create } from 'zustand'

interface SocketState {
  isForumConnected: boolean
  isMessagesConnected: boolean
  setForumConnected: (connected: boolean) => void
  setMessagesConnected: (connected: boolean) => void
}

export const useSocketStore = create<SocketState>((set) => ({
  isForumConnected: false,
  isMessagesConnected: false,
  setForumConnected: (connected) => set({ isForumConnected: connected }),
  setMessagesConnected: (connected) => set({ isMessagesConnected: connected }),
}))
