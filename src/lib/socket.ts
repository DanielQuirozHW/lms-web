import { io, type Socket } from 'socket.io-client'
import { WS_URL } from '@/lib/config'

let forumSocket: Socket | null = null
let messagesSocket: Socket | null = null

// Called by socket.io on every connect and auto-reconnect attempt,
// so the token is always fresh rather than the one captured at construction time.
function tokenAuth(callback: (data: { token: string }) => void): void {
  fetch('/api/auth/token')
    .then((r) => r.json())
    .then(({ accessToken }: { accessToken: string | null }) =>
      callback({ token: accessToken ?? '' })
    )
    .catch(() => callback({ token: '' }))
}

export function getForumSocket(): Socket {
  if (forumSocket?.connected) return forumSocket
  forumSocket?.disconnect()
  forumSocket = io(`${WS_URL}/forum`, {
    auth: tokenAuth,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  })
  return forumSocket
}

export function getMessagesSocket(): Socket {
  if (messagesSocket?.connected) return messagesSocket
  messagesSocket?.disconnect()
  messagesSocket = io(`${WS_URL}/messages`, {
    auth: tokenAuth,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  })
  return messagesSocket
}

export function disconnectAll(): void {
  forumSocket?.disconnect()
  messagesSocket?.disconnect()
  forumSocket = null
  messagesSocket = null
}
