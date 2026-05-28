'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { truncate } from '@/lib/utils'
import type { ConversationWithPartner } from '@/hooks/queries/messages'

interface ConversationListProps {
  conversations: ConversationWithPartner[]
  activeUserId?: string
}

function getPartnerDisplay(conv: ConversationWithPartner): {
  name: string
  initials: string
  avatarUrl: string | null
} {
  if (conv.partner) {
    const { firstName, lastName, avatarUrl } = conv.partner
    return {
      name: `${firstName} ${lastName}`.trim(),
      initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?',
      avatarUrl: avatarUrl ?? null,
    }
  }
  // Fallback when partner data is not embedded
  const shortId = conv.partnerId.slice(0, 6)
  return { name: `Usuario ${shortId}`, initials: shortId[0]?.toUpperCase() ?? '?', avatarUrl: null }
}

export function ConversationList({ conversations, activeUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="bg-nexus-accent/15 flex h-12 w-12 items-center justify-center rounded-full">
          <MessageSquare className="text-nexus-accent h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-nexus-text text-sm font-medium">No tenés conversaciones aún</p>
        <p className="text-nexus-muted text-xs">
          Escribile a un compañero desde su perfil de curso
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-nexus-border divide-y" role="list" aria-label="Conversaciones">
      {conversations.map((conv) => {
        const { name, initials, avatarUrl } = getPartnerDisplay(conv)
        const isActive = conv.partnerId === activeUserId
        const lastContent = truncate(conv.lastMessage.content, 50)

        return (
          <li key={conv.partnerId} role="listitem">
            <Link
              href={`/messages/${conv.partnerId}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                isActive ? 'bg-nexus-accent-muted' : 'hover:bg-nexus-card'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Name + preview + time */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'truncate text-sm font-semibold',
                      isActive ? 'text-nexus-accent' : 'text-nexus-text'
                    )}
                  >
                    {name}
                  </p>
                  <time
                    dateTime={conv.lastMessage.createdAt}
                    className="text-nexus-muted shrink-0 text-[10px]"
                  >
                    {formatRelativeTime(conv.lastMessage.createdAt)}
                  </time>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-nexus-muted flex-1 truncate text-xs">{lastContent}</p>
                  {conv.unreadCount > 0 && (
                    <span
                      className="bg-nexus-accent flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      aria-label={`${conv.unreadCount} mensajes sin leer`}
                    >
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
