'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, CheckCircle, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { useVotePost, useAcceptAnswer, useDeletePost } from '@/hooks/mutations/forum'
import type { ForumPostWithAuthor } from '@/hooks/queries/forum'
import type { UserRole } from '@/types/models'

interface PostItemProps {
  post: ForumPostWithAuthor
  threadId: string
  threadAuthorId: string
  isClosed: boolean
  currentUserId: string
  currentUserRoles: UserRole[]
}

export function PostItem({
  post,
  threadId,
  threadAuthorId,
  isClosed,
  currentUserId,
  currentUserRoles,
}: PostItemProps) {
  const [localScore, setLocalScore] = useState(post.voteScore)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)

  const { mutate: vote, isPending: isVoting } = useVotePost(threadId)
  const { mutate: accept, isPending: isAccepting } = useAcceptAnswer(threadId)
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost(threadId)

  const isAdmin = currentUserRoles.includes('ADMIN')
  const isThreadAuthor = currentUserId === threadAuthorId
  const isPostAuthor = currentUserId === post.authorId
  const canAccept = isThreadAuthor && !isClosed && !post.isAcceptedAnswer
  const canDelete = isPostAuthor || isAdmin

  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : 'Usuario'
  const authorInitials = post.author
    ? `${post.author.firstName[0] ?? ''}${post.author.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  function handleVote(value: 1 | -1) {
    if (isVoting) return
    const newVote = userVote === value ? 0 : value
    const delta = newVote - userVote
    setLocalScore((prev) => prev + delta)
    setUserVote(newVote)

    vote(
      { postId: post.id, value },
      {
        onError: () => {
          // Roll back optimistic update
          setLocalScore(post.voteScore)
          setUserVote(0)
          toast.error('No se pudo registrar el voto')
        },
      }
    )
  }

  function handleAccept() {
    accept(post.id, {
      onSuccess: () => toast.success('Respuesta marcada como aceptada'),
      onError: () => toast.error('No se pudo aceptar la respuesta'),
    })
  }

  function handleDelete() {
    if (!confirm('¿Eliminar esta respuesta?')) return
    deletePost(post.id, {
      onSuccess: () => toast.success('Respuesta eliminada'),
      onError: () => toast.error('No se pudo eliminar la respuesta'),
    })
  }

  return (
    <article
      className={cn(
        'flex gap-4 rounded-xl border p-4',
        post.isAcceptedAnswer
          ? 'border-nexus-success bg-nexus-success/5'
          : 'border-nexus-border bg-nexus-card'
      )}
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleVote(1)}
          disabled={isVoting}
          aria-label="Votar positivo"
          className={cn(
            'rounded p-1 transition-colors',
            userVote === 1 ? 'text-nexus-accent' : 'text-nexus-muted hover:text-nexus-accent'
          )}
        >
          <ChevronUp className="h-5 w-5" aria-hidden="true" />
        </button>
        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            localScore > 0
              ? 'text-nexus-accent'
              : localScore < 0
                ? 'text-destructive'
                : 'text-nexus-muted'
          )}
          aria-label={`${localScore} votos`}
        >
          {localScore}
        </span>
        <button
          type="button"
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          aria-label="Votar negativo"
          className={cn(
            'rounded p-1 transition-colors',
            userVote === -1 ? 'text-destructive' : 'text-nexus-muted hover:text-destructive'
          )}
        >
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Accepted badge */}
        {post.isAcceptedAnswer && (
          <div className="text-nexus-success flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold">Respuesta aceptada</span>
          </div>
        )}

        {/* Content */}
        <p className="text-nexus-text text-sm leading-relaxed break-words whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Footer: author + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author?.avatarUrl ?? undefined} alt={authorName} />
              <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-[10px]">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-nexus-muted text-xs">{authorName}</span>
            <span className="text-nexus-muted text-xs" aria-hidden="true">
              ·
            </span>
            <time dateTime={post.createdAt} className="text-nexus-muted text-xs">
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {canAccept && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleAccept}
                disabled={isAccepting}
                className="text-nexus-success hover:bg-nexus-success/10 h-7 gap-1 px-2 text-xs"
              >
                {isAccepting ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                )}
                Aceptar
              </Button>
            )}

            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10 h-7 gap-1 px-2 text-xs"
                aria-label="Eliminar respuesta"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
