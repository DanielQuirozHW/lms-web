'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getForumSocket } from '@/lib/socket'
import { useCreatePost } from '@/hooks/mutations/forum'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 10_000

interface PostFormProps {
  threadId: string
  isClosed: boolean
}

export function PostForm({ threadId, isClosed }: PostFormProps) {
  const [content, setContent] = useState('')
  const { mutate, isPending } = useCreatePost(threadId)

  // Join the thread room on mount, leave on unmount or thread change
  useEffect(() => {
    const socket = getForumSocket()
    socket.emit('joinThread', { threadId })

    return () => {
      socket.emit('leaveThread', { threadId })
    }
  }, [threadId])

  const trimmed = content.trim()
  const canSubmit = trimmed.length >= 1 && trimmed.length <= MAX_LENGTH && !isPending && !isClosed

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    mutate(trimmed, {
      onSuccess: () => {
        setContent('')
        toast.success('Respuesta publicada')
      },
      onError: () => toast.error('No se pudo publicar la respuesta'),
    })
  }

  if (isClosed) {
    return (
      <p className="text-nexus-muted text-center text-sm">
        Este hilo está cerrado — no se pueden agregar más respuestas.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribí tu respuesta…"
          disabled={isPending}
          rows={3}
          maxLength={MAX_LENGTH}
          aria-label="Tu respuesta"
          className={cn(
            'w-full resize-none rounded-xl border px-4 py-3 text-sm',
            'border-nexus-border bg-nexus-bg text-nexus-text',
            'placeholder:text-nexus-muted/60',
            'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors'
          )}
        />
        {content.length > MAX_LENGTH * 0.9 && (
          <span
            className={cn(
              'absolute right-3 bottom-2 text-[10px]',
              content.length > MAX_LENGTH ? 'text-destructive' : 'text-nexus-muted'
            )}
            aria-live="polite"
          >
            {content.length}/{MAX_LENGTH}
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            canSubmit
              ? 'bg-nexus-accent hover:bg-nexus-accent-hover text-white'
              : 'bg-nexus-border text-nexus-muted cursor-not-allowed'
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? 'Publicando...' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
