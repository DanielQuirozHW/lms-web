'use client'

import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { Message } from '@/types/models'

interface MessageBubbleProps {
  message: Message
  isSent: boolean
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  const isRead = message.readAt !== null

  return (
    <div className={cn('flex', isSent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5',
          isSent
            ? 'bg-nexus-accent rounded-br-sm text-white'
            : 'bg-nexus-card text-nexus-text rounded-bl-sm'
        )}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
        <div
          className={cn('mt-1 flex items-center gap-1', isSent ? 'justify-end' : 'justify-start')}
        >
          <time
            dateTime={message.createdAt}
            className={cn('text-[10px]', isSent ? 'text-white/60' : 'text-nexus-muted')}
          >
            {formatRelativeTime(message.createdAt)}
          </time>
          {/* Read receipts — only for sent messages */}
          {isSent &&
            (isRead ? (
              <CheckCheck className="h-3 w-3 text-white/70" aria-label="Leído" />
            ) : (
              <Check className="h-3 w-3 text-white/50" aria-label="Enviado" />
            ))}
        </div>
      </div>
    </div>
  )
}
