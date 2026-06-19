'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateProgress } from '@/hooks/mutations/lessons'
import { Button } from '@/components/ui/button'
import { RichTextRenderer } from './RichTextRenderer'

interface TextLessonProps {
  content: string
  courseId: string
  moduleId: string
  lessonId: string
  isAlreadyCompleted?: boolean
  onComplete?: () => void
}

export function TextLesson({
  content,
  courseId,
  moduleId,
  lessonId,
  isAlreadyCompleted = false,
  onComplete,
}: TextLessonProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted)
  const { mutate, isPending } = useUpdateProgress(courseId, moduleId, lessonId)

  function handleMarkComplete() {
    if (isCompleted) return
    mutate(
      { completed: true },
      {
        onSuccess: () => {
          setIsCompleted(true)
          onComplete?.()
          toast.success('Lección completada')
          router.refresh()
        },
        onError: () => toast.error('No se pudo marcar como completada'),
      }
    )
  }

  return (
    <div className="space-y-8">
      <RichTextRenderer content={content} />

      {/* Complete button */}
      <div className="border-nexus-border border-t pt-6">
        {isCompleted ? (
          <div className="text-nexus-success flex items-center gap-2">
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Lección completada</span>
          </div>
        ) : (
          <Button
            onClick={handleMarkComplete}
            disabled={isPending}
            className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Marcar como completado
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
