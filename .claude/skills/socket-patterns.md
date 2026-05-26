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

One factory per namespace. Never create `io()` calls directly in components.

**Critical**: `auth` is a **callback function**, not a static token object. Socket.io calls this callback on every connect and auto-reconnect, so the token is always fresh. A static `auth: { token }` string goes stale after 15 minutes. See MISTAKES.md [008].

```typescript
import { io, type Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000'

// Called by socket.io on every connect and reconnect — always fetches a fresh token
function tokenAuth(callback: (data: { token: string }) => void): void {
  fetch('/api/auth/token')
    .then((r) => r.json())
    .then(({ accessToken }: { accessToken: string | null }) =>
      callback({ token: accessToken ?? '' })
    )
    .catch(() => callback({ token: '' }))
}

let forumSocket: Socket | null = null
let messagesSocket: Socket | null = null

export function getForumSocket(): Socket {
  if (forumSocket?.connected) return forumSocket
  forumSocket?.disconnect()
  forumSocket = io(`${WS_URL}/forum`, {
    auth: tokenAuth, // ← callback form, not static object
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
```

---

## Using sockets in components

No `accessToken` parameter — the factory fetches the token internally. Always clean up event listeners in the `useEffect` return:

```tsx
'use client'
import { useEffect } from 'react'
import { getMessagesSocket } from '@/lib/socket'
import type { Message } from '@/types/models'

export function MessagesProvider() {
  useEffect(() => {
    const socket = getMessagesSocket()

    socket.on('newMessage', (msg: Message) => {
      // Update React Query cache or Zustand store
    })

    socket.on('messagesRead', ({ by }: { by: string }) => {
      // Update read receipts
    })

    return () => {
      socket.off('newMessage')
      socket.off('messagesRead')
    }
  }, []) // no session dependency — token is fetched by tokenAuth callback

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

Because `auth` is a callback function, **reconnections automatically use a fresh token** — no manual action required. The socket factory handles this transparently.

If you need to force a reconnection (e.g., after explicit sign-out):

```typescript
import { disconnectAll } from '@/lib/socket'

// On logout, disconnect all sockets — they won't reconnect automatically
// because the user is signing out
disconnectAll()
```

Do not call `disconnectAll()` on token refresh — the auto-reconnect callback will fetch the new token on its own.

---

## Zustand integration

The `socket.store.ts` tracks connection status so components can show online/offline state:

```typescript
import { useSocketStore } from '@/store/socket.store'

const isConnected = useSocketStore((s) => s.isMessagesConnected)
```

Update it in `connect` / `disconnect` event handlers:

```typescript
const { setMessagesConnected } = useSocketStore.getState()
socket.on('connect', () => setMessagesConnected(true))
socket.on('disconnect', () => setMessagesConnected(false))
```

---

## Common mistakes

| Mistake                                             | Fix                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `io()` called directly in a component               | Use `getForumSocket()` / `getMessagesSocket()` from `lib/socket.ts` |
| `auth: { token: accessToken }` (static string)      | Use `auth: tokenAuth` (callback) — static tokens expire in 15 min   |
| Passing `accessToken` as a parameter to the factory | Factories no longer accept a token param — `tokenAuth` fetches it   |
| Not removing event listeners on unmount             | Always return cleanup function from `useEffect`                     |
| Calling `disconnectAll()` on token refresh          | Not needed — the auth callback fetches a fresh token automatically  |
| Emitting events without checking `socket.connected` | Check before emit or handle in `connect` callback                   |
| One socket instance for both namespaces             | Each namespace needs its own socket instance                        |
