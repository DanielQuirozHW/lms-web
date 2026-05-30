'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDuplicateCourse } from '@/hooks/mutations/courses'
import { InlineConfirmActions } from '@/components/shared/feedback/InlineConfirmActions'

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
        <InlineConfirmActions
          onConfirm={() => duplicate()}
          onCancel={() => setShowConfirm(false)}
          isPending={isPending}
        />
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
