'use client'

import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 4000

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmed = content.trim()
  const isOverLimit = content.length > MAX_LENGTH
  const canSend = !!trimmed && !disabled && !isOverLimit

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    // max 4 rows ≈ 24px line-height × 4 + 2×8px padding = ~112px
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    resize()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    if (!canSend) return
    onSend(trimmed)
    setContent('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
          disabled={disabled}
          rows={1}
          aria-label="Mensaje"
          aria-multiline="true"
          className={cn(
            'w-full resize-none overflow-hidden rounded-xl border px-4 py-2.5 text-sm',
            'border-nexus-border bg-nexus-bg text-nexus-text',
            'placeholder:text-nexus-muted/60',
            'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors'
          )}
        />
        {/* Character counter — shown only when near or over limit */}
        {content.length > MAX_LENGTH * 0.8 && (
          <span
            className={cn(
              'absolute right-3 bottom-2 text-[10px]',
              isOverLimit ? 'text-destructive' : 'text-nexus-muted'
            )}
            aria-live="polite"
          >
            {content.length}/{MAX_LENGTH}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Enviar mensaje"
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
          canSend
            ? 'bg-nexus-accent hover:bg-nexus-accent-hover text-white'
            : 'bg-nexus-border text-nexus-muted cursor-not-allowed'
        )}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
