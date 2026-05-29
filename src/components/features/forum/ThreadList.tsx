'use client'

import Link from 'next/link'
import { Pin, Lock, MessageSquare, PlusCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { ForumThreadWithAuthor } from '@/hooks/queries/forum'

interface ThreadListProps {
  courseId: string
  threads: ForumThreadWithAuthor[]
  selectedThreadId: string | null
  onNewThread: () => void
}

function getAuthorDisplay(thread: ForumThreadWithAuthor) {
  if (thread.author) {
    const { firstName, lastName, avatarUrl } = thread.author
    return {
      name: `${firstName} ${lastName}`.trim(),
      initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?',
      avatarUrl: avatarUrl ?? null,
    }
  }
  const shortId = thread.authorId.slice(0, 4)
  return { name: `Usuario`, initials: shortId.toUpperCase(), avatarUrl: null }
}

export function ThreadList({ courseId, threads, selectedThreadId, onNewThread }: ThreadListProps) {
  // Pinned threads first
  const sorted = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  })

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-nexus-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-nexus-text text-sm font-semibold">Preguntas</h2>
        <Button
          size="sm"
          onClick={onNewThread}
          className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          aria-label="Nueva pregunta"
        >
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Nueva
        </Button>
      </div>

      {/* Thread items */}
      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <MessageSquare className="text-nexus-muted/40 h-8 w-8" aria-hidden="true" />
          <p className="text-nexus-text text-sm font-medium">Sin preguntas aún</p>
          <p className="text-nexus-muted text-xs">Sé el primero en hacer una pregunta</p>
        </div>
      ) : (
        <ul className="divide-nexus-border flex-1 divide-y overflow-y-auto" role="list">
          {sorted.map((thread) => {
            const { name, initials, avatarUrl } = getAuthorDisplay(thread)
            const isSelected = thread.id === selectedThreadId

            return (
              <li key={thread.id}>
                <Link
                  href={`/courses/${courseId}/forum?thread=${thread.id}`}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    isSelected ? 'bg-nexus-accent-muted' : 'hover:bg-nexus-card'
                  )}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                    <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                    <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1.5">
                      {thread.isPinned && (
                        <Pin
                          className="text-nexus-accent mt-0.5 h-3 w-3 shrink-0"
                          aria-label="Fijado"
                        />
                      )}
                      {thread.isClosed && (
                        <Lock
                          className="text-nexus-muted mt-0.5 h-3 w-3 shrink-0"
                          aria-label="Cerrado"
                        />
                      )}
                      <p
                        className={cn(
                          'text-sm leading-snug font-medium',
                          isSelected ? 'text-nexus-accent' : 'text-nexus-text'
                        )}
                      >
                        {thread.title}
                      </p>
                    </div>
                    <div className="text-nexus-muted mt-1 flex items-center gap-2 text-[10px]">
                      <span>{name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" />
                        {thread.postCount}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={thread.lastActivityAt}>
                        {formatRelativeTime(thread.lastActivityAt)}
                      </time>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
