'use client'

import { useState } from 'react'
import { Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDuplicateCourse } from '@/hooks/mutations/courses'

interface DuplicateCourseButtonProps {
  courseId: string
}

export function DuplicateCourseButton({ courseId }: DuplicateCourseButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: duplicate, isPending } = useDuplicateCourse(courseId)

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-nexus-muted">¿Duplicar este curso?</span>
        <button
          type="button"
          onClick={() => duplicate()}
          disabled={isPending}
          className="text-nexus-accent hover:text-nexus-accent-hover font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Duplicando...
            </span>
          ) : (
            'Confirmar'
          )}
        </button>
        {!isPending && (
          <>
            <span className="text-nexus-muted">/</span>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="text-nexus-muted hover:text-nexus-text transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className="border-nexus-border text-nexus-muted hover:text-nexus-text flex items-center gap-1.5"
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
      Duplicar curso
    </Button>
  )
}
