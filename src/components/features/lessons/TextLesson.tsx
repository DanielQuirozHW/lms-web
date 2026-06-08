'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { sanitize } from '@/lib/sanitize'
import { useUpdateProgress } from '@/hooks/mutations/lessons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  // sanitize() uses DOMPurify client-side; this component is 'use client' — MISTAKES.md [009]
  const safeHtml = sanitize(content)

  // Prose class list extracted so <article> fits on one line (required for eslint-disable-next-line)
  const proseClass = cn(
    'max-w-none text-nexus-text',
    '[&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-nexus-text',
    '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-nexus-text',
    '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-nexus-text',
    '[&_p]:mb-4 [&_p]:leading-relaxed',
    '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6',
    '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6',
    '[&_li]:mb-1 [&_li]:leading-relaxed',
    '[&_code]:rounded [&_code]:bg-nexus-card [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_code]:text-nexus-accent',
    '[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-nexus-card [&_pre]:p-4',
    '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
    '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-nexus-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-nexus-muted',
    '[&_a]:text-nexus-accent [&_a]:underline [&_a:hover]:text-nexus-accent-hover',
    '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl',
    '[&_hr]:my-6 [&_hr]:border-nexus-border',
    '[&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse',
    '[&_th]:border [&_th]:border-nexus-border [&_th]:bg-nexus-card [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold',
    '[&_td]:border [&_td]:border-nexus-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm'
  )

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
      {/* Lesson content — sanitized with DOMPurify before rendering */}
      {/* eslint-disable-next-line react/no-danger */}
      <article className={proseClass} dangerouslySetInnerHTML={{ __html: safeHtml }} />

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
