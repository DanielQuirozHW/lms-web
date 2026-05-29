'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { useGradeSubmission } from '@/hooks/mutations/assignments'
import type { SubmissionWithStudent } from '@/hooks/queries/assignments'

interface GradeSubmissionDialogProps {
  lessonId: string
  submission: SubmissionWithStudent
  maxScore: number
  onClose: () => void
  onSuccess: () => void
}

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function GradeSubmissionDialog({
  lessonId,
  submission,
  maxScore,
  onClose,
  onSuccess,
}: GradeSubmissionDialogProps) {
  const { mutate: gradeSubmission, isPending } = useGradeSubmission(lessonId)

  const schema = z.object({
    grade: z.number().min(0, 'Mínimo 0').max(maxScore, `Máximo ${maxScore}`),
    feedback: z.string().optional(),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      grade: submission.grade ?? 0,
      feedback: submission.feedback ?? '',
    },
  })

  const studentName = submission.student
    ? `${submission.student.firstName} ${submission.student.lastName}`.trim()
    : `Inscripción ${submission.enrollmentId.slice(0, 6)}`

  function onSubmit(values: FormValues) {
    gradeSubmission(
      { submissionId: submission.id, grade: values.grade, feedback: values.feedback },
      {
        onSuccess: () => {
          toast.success('Calificación guardada')
          onSuccess()
          onClose()
        },
        onError: () => toast.error('No se pudo guardar la calificación'),
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div className="border-nexus-border bg-nexus-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-nexus-border flex shrink-0 items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="grade-dialog-title" className="text-nexus-text text-base font-semibold">
              Calificar entrega
            </h2>
            <p className="text-nexus-muted text-xs">
              {studentName} · Intento #{submission.attemptNumber} ·{' '}
              {formatDate(submission.submittedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar"
            className="text-nexus-muted hover:text-nexus-text transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Submission content */}
          <div className="space-y-1">
            <p className="text-nexus-text text-xs font-semibold tracking-wide uppercase">
              Respuesta del estudiante
            </p>
            <div className="border-nexus-border bg-nexus-bg text-nexus-text max-h-48 overflow-y-auto rounded-xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
              {submission.content}
            </div>
          </div>

          {/* File link */}
          {submission.fileUrl && (
            <div>
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nexus-accent hover:text-nexus-accent-hover flex items-center gap-1.5 text-sm transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Ver archivo adjunto
              </a>
            </div>
          )}

          {/* Grade form */}
          <Form {...form}>
            <form
              id="grade-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">
                      Calificación
                      <span className="text-nexus-muted ml-1 font-normal">(0 – {maxScore})</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.1"
                        className={inputClass}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">
                      Retroalimentación{' '}
                      <span className="text-nexus-muted font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <textarea
                        rows={4}
                        placeholder="Comentarios para el estudiante..."
                        className={cn(
                          inputClass,
                          'w-full resize-none rounded-lg border px-3 py-2 text-sm',
                          'placeholder:text-nexus-muted/60',
                          'focus:border-nexus-accent focus:ring-nexus-accent/50 focus:ring-2 focus:outline-none',
                          'transition-colors'
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="border-nexus-border flex shrink-0 justify-end gap-2 border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="border-nexus-border text-nexus-muted"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="grade-form"
            disabled={isPending}
            className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Guardar calificación
          </Button>
        </div>
      </div>
    </div>
  )
}
