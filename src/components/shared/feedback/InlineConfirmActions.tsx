'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineConfirmActionsProps {
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'destructive' | 'default'
}

export function InlineConfirmActions({
  onConfirm,
  onCancel,
  isPending = false,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'default',
}: InlineConfirmActionsProps) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className={cn(
          'font-medium transition-colors disabled:opacity-50',
          confirmVariant === 'destructive'
            ? 'text-destructive hover:text-destructive/80'
            : 'text-nexus-accent hover:text-nexus-accent-hover'
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          confirmLabel
        )}
      </button>
      <span className="text-nexus-muted">/</span>
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="text-nexus-muted hover:text-nexus-text transition-colors"
      >
        {cancelLabel}
      </button>
    </div>
  )
}
