'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMessagesSocket } from '@/lib/socket'
import api from '@/lib/api'
import { useNotificationsStore } from '@/store/notifications.store'
import { cn } from '@/lib/utils'
import type { Message, PublicUser } from '@/types/models'

interface ChatWindowProps {
  userId: string
  initialMessages: Message[]
  partner: Pick<PublicUser, 'firstName' | 'lastName' | 'avatarUrl'> | null
}

export function ChatWindow({ userId, initialMessages, partner }: ChatWindowProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)
  const [isSendingHttp, setIsSendingHttp] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const setMessagesUnreadCount = useNotificationsStore((s) => s.setMessagesUnreadCount)

  const partnerName = partner ? `${partner.firstName} ${partner.lastName}`.trim() : `Usuario`
  const partnerInitials = partner
    ? `${partner.firstName[0] ?? ''}${partner.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  // Mark conversation as read on mount and reset the unread badge
  useEffect(() => {
    api
      .patch(`/messages/${userId}/read`)
      .then(() => setMessagesUnreadCount(0))
      .catch(() => {
        // Non-critical — don't surface to user
      })
  }, [userId, setMessagesUnreadCount])

  // WebSocket connection
  useEffect(() => {
    const socket = getMessagesSocket()

    function handleNewMessage(msg: Message) {
      // Only handle messages for this conversation
      const isFromPartner = msg.senderId === userId && msg.receiverId === currentUserId
      const isFromSelf = msg.senderId === currentUserId && msg.receiverId === userId

      if (!isFromPartner && !isFromSelf) return

      setMessages((prev) => {
        // Deduplicate — server may echo our own messages
        if (prev.some((m) => m.id === msg.id)) return prev
        // Cap at 500 messages to prevent unbounded memory growth from
        // flooding attacks. Oldest messages are discarded first.
        return [...prev, msg].slice(-500)
      })
    }

    function handleMessagesRead({ by }: { by: string }) {
      if (by !== userId) return
      // Mark all sent messages as read
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m
        )
      )
    }

    function handleConnect() {
      setIsConnected(true)
    }
    function handleDisconnect() {
      setIsConnected(false)
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('messagesRead', handleMessagesRead)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    // Check initial connection state asynchronously — synchronous setState in
    // an effect body triggers the React Compiler's cascading-render warning.
    const initTimer = setTimeout(() => {
      if (socket.connected) setIsConnected(true)
    }, 0)

    return () => {
      clearTimeout(initTimer)
      socket.off('newMessage', handleNewMessage)
      socket.off('messagesRead', handleMessagesRead)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [userId, currentUserId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (content: string) => {
      const socket = getMessagesSocket()

      if (socket.connected) {
        // WebSocket path — emit and add optimistically
        socket.emit('sendMessage', { receiverId: userId, content })
        const optimistic: Message = {
          id: `opt-${Date.now()}`,
          senderId: currentUserId ?? '',
          receiverId: userId,
          content,
          readAt: null,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimistic])
      } else {
        // HTTP fallback
        setIsSendingHttp(true)
        try {
          const r = await api.post<Message>(`/messages/${userId}`, { content })
          // After interceptor: r.data is Message
          setMessages((prev) => [...prev, r.data])
        } catch {
          toast.error('No se pudo enviar el mensaje. Intentá de nuevo.')
        } finally {
          setIsSendingHttp(false)
        }
      }
    },
    [userId, currentUserId]
  )

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <header className="border-nexus-border bg-nexus-surface flex items-center gap-3 border-b px-4 py-3">
        {/* Back button — mobile only */}
        <Link
          href="/messages"
          className="text-nexus-muted hover:text-nexus-text shrink-0 transition-colors md:hidden"
          aria-label="Volver a mensajes"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>

        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={partner?.avatarUrl ?? undefined} alt={partnerName} />
          <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-sm">
            {partnerInitials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-nexus-text truncate text-sm font-semibold">{partnerName}</p>
          {!isConnected && (
            <p className="text-nexus-muted flex items-center gap-1 text-[10px]">
              <WifiOff className="h-3 w-3" aria-hidden="true" />
              Conectando...
            </p>
          )}
        </div>
      </header>

      {/* Messages — scrollable */}
      <div
        className="flex-1 space-y-2 overflow-y-auto p-4"
        role="log"
        aria-label="Conversación"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-nexus-muted text-sm">
              No hay mensajes aún. ¡Empezá la conversación!
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isSent={msg.senderId === currentUserId} />
        ))}
        {/* Anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className={cn(
          'border-nexus-border bg-nexus-surface border-t p-3',
          'transition-opacity',
          !isConnected && 'opacity-70'
        )}
      >
        <MessageInput onSend={handleSend} disabled={isSendingHttp} />
      </div>
    </div>
  )
}
