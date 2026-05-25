import { io, type Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000'

let forumSocket: Socket | null = null
let messagesSocket: Socket | null = null

export function getForumSocket(accessToken: string): Socket {
  if (forumSocket?.connected) return forumSocket
  forumSocket?.disconnect()
  forumSocket = io(`${WS_URL}/forum`, {
    auth: { token: accessToken },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  })
  return forumSocket
}

export function getMessagesSocket(accessToken: string): Socket {
  if (messagesSocket?.connected) return messagesSocket
  messagesSocket?.disconnect()
  messagesSocket = io(`${WS_URL}/messages`, {
    auth: { token: accessToken },
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
