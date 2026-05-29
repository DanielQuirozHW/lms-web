'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MessageCircle, Lock } from 'lucide-react'
import { ThreadList } from './ThreadList'
import { ThreadForm } from './ThreadForm'
import { PostItem } from './PostItem'
import { PostForm } from './PostForm'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { useThread } from '@/hooks/queries/forum'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { ForumThreadWithAuthor } from '@/hooks/queries/forum'
import type { UserRole } from '@/types/models'

interface ForumShellProps {
  courseId: string
  initialThreads: ForumThreadWithAuthor[]
  currentUserId: string
  currentUserRoles: UserRole[]
}

// ─── Thread detail panel ──────────────────────────────────────────────────────

function ThreadDetailPanel({
  threadId,
  courseId,
  currentUserId,
  currentUserRoles,
}: {
  threadId: string
  courseId: string
  currentUserId: string
  currentUserRoles: UserRole[]
}) {
  const router = useRouter()
  const { data: thread, isLoading, isError } = useThread(threadId)

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <LoadingSpinner rows={4} />
      </div>
    )
  }

  if (isError || !thread) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-nexus-muted text-sm">No se pudo cargar la pregunta.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Thread header */}
      <div className="border-nexus-border bg-nexus-surface border-b px-4 py-3">
        {/* Mobile back button */}
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}/forum`)}
          className="text-nexus-muted hover:text-nexus-text mb-2 flex items-center gap-1 text-xs transition-colors md:hidden"
          aria-label="Volver al foro"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Preguntas
        </button>

        <div className="flex items-start gap-2">
          {thread.isClosed && (
            <Lock className="text-nexus-muted mt-0.5 h-4 w-4 shrink-0" aria-label="Cerrado" />
          )}
          <h1 className="text-nexus-text flex-1 text-base leading-snug font-semibold">
            {thread.title}
          </h1>
        </div>
        <p className="text-nexus-muted mt-1 text-xs">
          {thread.postCount} respuesta{thread.postCount !== 1 && 's'}{' '}
          <span aria-hidden="true">·</span> última actividad{' '}
          <time dateTime={thread.lastActivityAt}>{formatRelativeTime(thread.lastActivityAt)}</time>
        </p>
      </div>

      {/* Posts — scrollable */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thread.posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <MessageCircle className="text-nexus-muted/30 h-10 w-10" aria-hidden="true" />
            <p className="text-nexus-muted text-sm">
              Sin respuestas todavía. ¡Sé el primero en responder!
            </p>
          </div>
        ) : (
          thread.posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              threadId={thread.id}
              threadAuthorId={thread.authorId}
              isClosed={thread.isClosed}
              currentUserId={currentUserId}
              currentUserRoles={currentUserRoles}
            />
          ))
        )}
      </div>

      {/* Reply form */}
      <div className="border-nexus-border bg-nexus-surface border-t p-4">
        <PostForm threadId={thread.id} isClosed={thread.isClosed} />
      </div>
    </div>
  )
}

// ─── Forum shell ──────────────────────────────────────────────────────────────

export function ForumShell({
  courseId,
  initialThreads,
  currentUserId,
  currentUserRoles,
}: ForumShellProps) {
  const searchParams = useSearchParams()
  const selectedThreadId = searchParams.get('thread')
  const [isThreadFormOpen, setIsThreadFormOpen] = useState(false)

  return (
    <>
      <div className="-m-4 -mb-20 flex h-[calc(100dvh-56px)] overflow-hidden lg:-m-6 lg:-mb-6">
        {/* Thread list — hidden on mobile when a thread is selected */}
        <aside
          className={cn(
            'border-nexus-border bg-nexus-surface flex flex-col border-r',
            'w-full md:w-95 md:shrink-0',
            selectedThreadId && 'hidden md:flex'
          )}
        >
          <ThreadList
            courseId={courseId}
            threads={initialThreads}
            selectedThreadId={selectedThreadId}
            onNewThread={() => setIsThreadFormOpen(true)}
          />
        </aside>

        {/* Thread detail or empty state */}
        <main
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            !selectedThreadId && 'hidden md:flex'
          )}
        >
          {selectedThreadId ? (
            <ThreadDetailPanel
              threadId={selectedThreadId}
              courseId={courseId}
              currentUserId={currentUserId}
              currentUserRoles={currentUserRoles}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="bg-nexus-accent/15 flex h-16 w-16 items-center justify-center rounded-full">
                <MessageCircle className="text-nexus-accent h-8 w-8" aria-hidden="true" />
              </div>
              <p className="text-nexus-text text-sm font-medium">
                Seleccioná una pregunta o creá una nueva
              </p>
              <p className="text-nexus-muted text-xs">
                El foro del curso es un espacio para compartir dudas y ayudarse
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Create thread dialog */}
      <ThreadForm
        courseId={courseId}
        isOpen={isThreadFormOpen}
        onClose={() => setIsThreadFormOpen(false)}
      />
    </>
  )
}
