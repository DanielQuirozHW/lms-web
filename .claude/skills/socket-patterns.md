# Socket Patterns — LMS Web

Read this before writing any real-time / WebSocket code.

---

## Namespaces

| Namespace   | Purpose                   | Events emitted by client    | Events received from server                      |
| ----------- | ------------------------- | --------------------------- | ------------------------------------------------ |
| `/forum`    | Forum thread live updates | `joinThread`, `leaveThread` | (none currently — designed for future `newPost`) |
| `/messages` | Private messaging         | `sendMessage`, `markRead`   | `newMessage`, `messagesRead`                     |

---

## Socket factory — `lib/socket.ts`

One factory function. Never create `io()` calls directly in components.

```typescript
import { io, Socket } from 'socket.io-client'

let forumSocket: Socket | null = null
let messagesSocket: Socket | null = null

export function getForumSocket(accessToken: string): Socket {
  if (forumSocket?.connected) return forumSocket
  forumSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}/forum`, {
    auth: { token: accessToken },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
  return forumSocket
}

export function getMessagesSocket(accessToken: string): Socket {
  if (messagesSocket?.connected) return messagesSocket
  messagesSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}/messages`, {
    auth: { token: accessToken },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
  return messagesSocket
}

export function disconnectAll() {
  forumSocket?.disconnect()
  messagesSocket?.disconnect()
  forumSocket = null
  messagesSocket = null
}
```

---

## Using sockets in components

Always clean up in `useEffect` return:

```tsx
'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getMessagesSocket } from '@/lib/socket'
import type { MessageResponse } from '@/types/models'

export function MessagesProvider() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.accessToken) return

    const socket = getMessagesSocket(session.accessToken)

    socket.on('newMessage', (msg: MessageResponse) => {
      // Update React Query cache or Zustand store
    })

    socket.on('messagesRead', ({ by }: { by: string }) => {
      // Update read receipts
    })

    return () => {
      socket.off('newMessage')
      socket.off('messagesRead')
    }
  }, [session?.accessToken])

  return null
}
```

---

## Forum thread subscription

```typescript
// When a user opens a forum thread page:
socket.emit('joinThread', { threadId })

// When they navigate away:
socket.emit('leaveThread', { threadId })
```

---

## Sending a message via WebSocket vs REST

Both work. Use the REST endpoint (`POST /messages/:userId`) when:

- You need the response body to update the UI
- You are not sure the socket is connected

Use the WebSocket `sendMessage` event when:

- Real-time latency matters and you can handle optimistic updates

The server will emit `newMessage` to the receiver regardless of which path you use.

---

## Rate limit awareness

The server disconnects a client that exceeds **20 events per 10 seconds**. Do not emit events in rapid loops. Debounce user actions that could trigger many events (e.g., typing indicators).

---

## Token refresh and reconnection

When the access token is refreshed (Auth.js session update), the socket must reconnect with the new token:

```typescript
useEffect(() => {
  if (!session?.accessToken) return
  // Disconnect old socket and create a new one with the refreshed token
  disconnectAll()
  const socket = getMessagesSocket(session.accessToken)
  // re-attach listeners...
  return () => {
    socket.off('newMessage')
    socket.off('messagesRead')
  }
}, [session?.accessToken]) // dependency on token — reconnects on refresh
```

---

## Zustand integration

The `socket.store.ts` tracks connection status so components can show online/offline state:

```typescript
import { useSocketStore } from '@/store/socket.store'

const isConnected = useSocketStore((s) => s.isMessagesConnected)
```

---

## Common mistakes

| Mistake                                             | Fix                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| Creating `io()` directly in a component             | Use `getForumSocket()` / `getMessagesSocket()` from `lib/socket.ts` |
| Not removing event listeners on unmount             | Always return cleanup function from `useEffect`                     |
| Passing `accessToken` from `localStorage`           | Read from Auth.js session only                                      |
| Emitting events without checking `socket.connected` | Check before emit or handle in `connect` callback                   |
| One socket instance for both namespaces             | Each namespace needs its own socket instance                        |
