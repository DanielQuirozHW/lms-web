'use client'

import { useState, useRef, useEffect } from 'react'
import { StickyNote, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLessonNote } from '@/hooks/queries/notes'
import { useSaveNote, useDeleteNote } from '@/hooks/mutations/notes'
import { InlineConfirmActions } from '@/components/shared/feedback/InlineConfirmActions'

const MAX_CHARS = 10_000

interface LessonNotesProps {
  lessonId: string
}

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const { data: note, isLoading } = useLessonNote(lessonId)
  const { mutate: save } = useSaveNote(lessonId)
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote(lessonId)

  const [isOpen, setIsOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Local content tracking: only set when user starts editing
  const [localContent, setLocalContent] = useState('')
  const [isLocalEdit, setIsLocalEdit] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear timers on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (savedResetTimerRef.current) clearTimeout(savedResetTimerRef.current)
    }
  }, [])

  // Display: user's pending edits take priority over the server-saved note
  const displayContent = isLocalEdit ? localContent : (note?.content ?? '')
  const charCount = displayContent.length

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    if (value.length > MAX_CHARS) return

    setLocalContent(value)
    setIsLocalEdit(true)

    // Debounce: reset timer on every keystroke
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (savedResetTimerRef.current) clearTimeout(savedResetTimerRef.current)
    setSaveStatus('idle')

    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving')
      save(
        { content: value },
        {
          onSuccess: () => {
            // React Query cache now has the updated note; stop tracking local edit
            setIsLocalEdit(false)
            setLocalContent('')
            setSaveStatus('saved')
            savedResetTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
          },
          onError: () => {
            setSaveStatus('idle')
          },
        }
      )
    }, 2000)
  }

  function handleDelete() {
    deleteNote(undefined, {
      onSuccess: () => {
        setConfirmDelete(false)
        setIsLocalEdit(false)
        setLocalContent('')
        setSaveStatus('idle')
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      },
    })
  }

  const hasContent = displayContent.length > 0
  const showDeleteButton = hasContent && (note !== null || isLocalEdit)

  return (
    <div className="border-nexus-border bg-nexus-card rounded-xl border">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3 transition-colors',
          'text-nexus-muted hover:text-nexus-text',
          isOpen && 'border-nexus-border border-b'
        )}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="h-4 w-4" aria-hidden="true" />
          Mis notas
          {hasContent && !isOpen && (
            <span className="bg-nexus-accent/15 text-nexus-accent rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
              {charCount}
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm">
              <Loader2 className="text-nexus-muted h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="text-nexus-muted">Cargando notas...</span>
            </div>
          ) : (
            <>
              <textarea
                value={displayContent}
                onChange={handleChange}
                rows={6}
                maxLength={MAX_CHARS}
                placeholder="Escribí tus notas aquí..."
                className={cn(
                  'border-nexus-border bg-nexus-bg text-nexus-text placeholder:text-nexus-muted/50',
                  'w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-relaxed',
                  'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
                  'transition-colors'
                )}
                aria-label="Notas de la lección"
              />

              {/* Footer: char count + save status + delete */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-nexus-muted text-xs">
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>

                <div className="flex items-center gap-3">
                  {/* Save status */}
                  <span
                    className={cn(
                      'text-xs transition-opacity',
                      saveStatus === 'idle' && 'opacity-0',
                      saveStatus === 'saving' && 'text-nexus-muted',
                      saveStatus === 'saved' && 'text-nexus-success'
                    )}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {saveStatus === 'saving' && (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        Guardando...
                      </span>
                    )}
                    {saveStatus === 'saved' && 'Guardado ✓'}
                  </span>

                  {/* Delete */}
                  {showDeleteButton &&
                    (confirmDelete ? (
                      <InlineConfirmActions
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmDelete(false)}
                        isPending={isDeleting}
                        confirmVariant="destructive"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        title="Eliminar nota"
                        className="text-nexus-muted hover:text-destructive transition-colors"
                        aria-label="Eliminar nota"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
