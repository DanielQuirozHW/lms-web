'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Paperclip,
  X,
  Loader2,
  ArrowRight,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button, buttonVariants } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { cn } from '@/lib/utils'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { useAssignmentSettings, useMySubmissions } from '@/hooks/queries/assignments'
import { useSubmitAssignment, useUploadAssignmentFile } from '@/hooks/mutations/assignments'
import type { Submission, GradingType } from '@/types/models'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  content: z.string().min(1, 'El contenido es requerido').max(50000, 'Máximo 50.000 caracteres'),
})

type FormValues = z.infer<typeof schema>

// ─── Due date helper ──────────────────────────────────────────────────────────

type DueDateStatus = 'none' | 'upcoming' | 'warning' | 'overdue'

function getDueDateStatus(dueDate: string | null): DueDateStatus {
  if (!dueDate) return 'none'
  const diff = new Date(dueDate).getTime() - Date.now()
  if (diff < 0) return 'overdue'
  if (diff < 24 * 60 * 60 * 1000) return 'warning'
  return 'upcoming'
}

// ─── Grade display helper ─────────────────────────────────────────────────────

function gradeColor(grade: number | null, maxScore: number, passingScore: number | null): string {
  if (grade === null) return 'text-nexus-muted'
  const pct = (grade / maxScore) * 100
  if (passingScore !== null && pct < passingScore) return 'text-destructive'
  return 'text-nexus-success'
}

// ─── File upload zone ─────────────────────────────────────────────────────────

interface FileUploadZoneProps {
  fileName: string | null
  isUploading: boolean
  onFile: (file: File) => void
  onClear: () => void
}

function FileUploadZone({ fileName, isUploading, onFile, onClear }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 50 MB')
      e.target.value = ''
      return
    }
    onFile(file)
    e.target.value = ''
  }

  if (fileName) {
    return (
      <div className="border-nexus-border bg-nexus-bg flex items-center gap-3 rounded-xl border px-4 py-3">
        <Paperclip className="text-nexus-accent h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-nexus-text flex-1 truncate text-sm">{fileName}</span>
        <button
          type="button"
          onClick={onClear}
          disabled={isUploading}
          aria-label="Eliminar archivo"
          className="text-nexus-muted hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 transition-colors',
          'border-nexus-border bg-nexus-bg',
          'hover:border-nexus-accent/50 hover:text-nexus-text',
          isUploading && 'cursor-not-allowed opacity-60'
        )}
        aria-label="Adjuntar archivo"
      >
        {isUploading ? (
          <Loader2 className="text-nexus-accent h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="text-nexus-muted h-5 w-5" aria-hidden="true" />
        )}
        <span className="text-nexus-muted text-sm">
          {isUploading ? 'Subiendo...' : 'Adjuntar archivo (opcional, máx. 50 MB)'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
      />
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AssignmentPlayerProps {
  lessonId: string
  nextLessonHref: string | null
}

type Phase = 'instructions' | 'submitting' | 'submitted'

export function AssignmentPlayer({ lessonId, nextLessonHref }: AssignmentPlayerProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('instructions')
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const { data: settings, isLoading: settingsLoading } = useAssignmentSettings(lessonId)
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissions(lessonId)
  const { mutate: submitAssignment, isPending: isSubmitting } = useSubmitAssignment(lessonId)
  const { mutate: uploadFile, isPending: isUploading } = useUploadAssignmentFile()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: '' },
  })

  const contentValue = useWatch({ control: form.control, name: 'content', defaultValue: '' })

  // ── Permission checks ────────────────────────────────────────────────────────

  const submissionsCount = submissions?.length ?? 0
  const maxAttempts = settings?.maxAttempts ?? null
  const isPastDue = settings?.dueDate ? new Date(settings.dueDate) < new Date() : false
  const cannotSubmitLate = isPastDue && !settings?.allowLateSubmission
  const canSubmit = !cannotSubmitLate && (maxAttempts === null || submissionsCount < maxAttempts)
  const dueDateStatus = getDueDateStatus(settings?.dueDate ?? null)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleFileUpload(file: File) {
    setFileName(file.name)
    uploadFile(file, {
      onSuccess: (url) => setFileUrl(url),
      onError: () => {
        toast.error('No se pudo subir el archivo')
        setFileName(null)
        setFileUrl(null)
      },
    })
  }

  function handleFileClear() {
    setFileUrl(null)
    setFileName(null)
  }

  function onSubmit(values: FormValues) {
    submitAssignment(
      { content: values.content, fileUrl },
      {
        onSuccess: (submission) => {
          setLastSubmission(submission)
          form.reset()
          setFileUrl(null)
          setFileName(null)
          toast.success('✓ Lección completada')
          router.refresh()
          setPhase('submitted')
        },
        onError: () => toast.error('No se pudo enviar la tarea. Intentá de nuevo.'),
      }
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (settingsLoading || submissionsLoading) {
    return (
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
        <LoadingSpinner rows={3} />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-8 text-center">
        <ClipboardList className="text-nexus-muted/30 mx-auto mb-3 h-10 w-10" aria-hidden="true" />
        <p className="text-nexus-text text-sm font-medium">Tarea no disponible</p>
      </div>
    )
  }

  // ── Instructions ─────────────────────────────────────────────────────────────

  if (phase === 'instructions') {
    return (
      <div className="border-nexus-border bg-nexus-card space-y-6 rounded-xl border p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="bg-nexus-accent/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <ClipboardList className="text-nexus-accent h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-nexus-text text-lg font-bold">Tarea</h2>
            <p className="text-nexus-muted mt-0.5 text-sm">
              {settings.gradingType === 'AUTOMATIC'
                ? 'Calificación automática'
                : 'Calificación manual'}
            </p>
          </div>
        </div>

        {/* Due date alert */}
        {dueDateStatus === 'overdue' && (
          <div
            role="alert"
            className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Fecha límite vencida — {formatDate(settings.dueDate!)}.{' '}
              {settings.allowLateSubmission
                ? 'Podés entregar de todas formas.'
                : 'Ya no se aceptan entregas.'}
            </span>
          </div>
        )}
        {dueDateStatus === 'warning' && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Vence en menos de 24 horas — {formatDate(settings.dueDate!)}.</span>
          </div>
        )}

        {/* Settings summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Puntuación máxima',
              value: `${settings.maxScore} puntos`,
            },
            {
              label: 'Nota mínima',
              value: settings.passingScore !== null ? `${settings.passingScore}%` : 'Sin mínimo',
            },
            {
              label: 'Intentos',
              value: maxAttempts === null ? 'Ilimitados' : `${submissionsCount} / ${maxAttempts}`,
            },
            ...(settings.dueDate
              ? [{ label: 'Fecha límite', value: formatDate(settings.dueDate) }]
              : []),
            ...(settings.isGroupAssignment ? [{ label: 'Modalidad', value: 'Grupal' }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="border-nexus-border bg-nexus-bg rounded-lg border p-3">
              <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
                {label}
              </p>
              <p className="text-nexus-text mt-0.5 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* Previous submissions */}
        {!!submissions?.length && (
          <div>
            <h3 className="text-nexus-text mb-2 text-sm font-semibold">Mis entregas anteriores</h3>
            <div className="divide-nexus-border border-nexus-border divide-y rounded-xl border">
              {submissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {sub.grade !== null ? (
                      <CheckCircle2
                        className={cn(
                          'h-4 w-4 shrink-0',
                          gradeColor(sub.grade, settings.maxScore, settings.passingScore)
                        )}
                        aria-hidden="true"
                      />
                    ) : (
                      <Clock className="text-nexus-muted h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <div>
                      <p className="text-nexus-text text-sm">Entrega #{sub.attemptNumber}</p>
                      <p className="text-nexus-muted text-xs">
                        {formatRelativeTime(sub.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {sub.grade !== null ? (
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          gradeColor(sub.grade, settings.maxScore, settings.passingScore)
                        )}
                      >
                        {sub.grade} / {settings.maxScore}
                      </span>
                    ) : (
                      <span className="text-nexus-muted text-xs">En revisión</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {submissionsCount === 0 && (
          <p className="text-nexus-muted text-sm">Entregá la tarea para completar esta lección</p>
        )}

        {/* Submit button */}
        <Button
          onClick={() => setPhase('submitting')}
          disabled={!canSubmit}
          className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
        >
          {!canSubmit
            ? cannotSubmitLate
              ? 'Entrega fuera de plazo'
              : 'Límite de intentos alcanzado'
            : submissionsCount > 0
              ? 'Nueva entrega'
              : 'Entregar tarea'}
        </Button>
      </div>
    )
  }

  // ── Submitting ───────────────────────────────────────────────────────────────

  if (phase === 'submitting') {
    const charCount = contentValue.length

    return (
      <div className="border-nexus-border bg-nexus-card space-y-6 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-nexus-text text-base font-semibold">
            Entrega #{submissionsCount + 1}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset()
              setFileUrl(null)
              setFileName(null)
              setPhase('instructions')
            }}
            disabled={isSubmitting}
            className="text-nexus-muted hover:text-nexus-text"
          >
            Cancelar
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Respuesta <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <textarea
                        rows={10}
                        placeholder="Escribí tu respuesta aquí..."
                        className={cn(
                          'w-full resize-none rounded-xl border px-4 py-3 text-sm',
                          'border-nexus-border bg-nexus-bg text-nexus-text',
                          'placeholder:text-nexus-muted/60',
                          'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          'transition-colors'
                        )}
                        disabled={isSubmitting}
                        {...field}
                      />
                      {/* Character counter */}
                      <span
                        className={cn(
                          'absolute right-3 bottom-3 text-[10px]',
                          charCount > 45000
                            ? 'text-amber-500'
                            : charCount > 50000
                              ? 'text-destructive'
                              : 'text-nexus-muted'
                        )}
                        aria-live="polite"
                      >
                        {charCount.toLocaleString()} / 50.000
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* File upload */}
            <div className="space-y-2">
              <p className="text-nexus-text text-sm font-medium">Archivo adjunto</p>
              <FileUploadZone
                fileName={fileName}
                isUploading={isUploading}
                onFile={handleFileUpload}
                onClear={handleFileClear}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || isUploading || charCount === 0}
                className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  'Enviar entrega'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  // ── Submitted ────────────────────────────────────────────────────────────────

  const sub = lastSubmission
  if (!sub) return null

  const isAutomatic: boolean = settings.gradingType === ('AUTOMATIC' as GradingType)

  return (
    <div className="border-nexus-border bg-nexus-card space-y-6 rounded-xl border p-6">
      {/* Status */}
      <div className="text-center">
        {sub.grade !== null ? (
          <CheckCircle2
            className={cn(
              'mx-auto mb-3 h-12 w-12',
              gradeColor(sub.grade, settings.maxScore, settings.passingScore)
            )}
            aria-hidden="true"
          />
        ) : (
          <Clock className="text-nexus-accent mx-auto mb-3 h-12 w-12" aria-hidden="true" />
        )}

        <h2 className="text-nexus-text text-xl font-bold">
          {sub.grade !== null ? '¡Entrega calificada!' : '¡Entrega enviada!'}
        </h2>
        <p className="text-nexus-muted mt-1 text-sm">Intento #{sub.attemptNumber}</p>
      </div>

      {/* Grade or pending */}
      {isAutomatic && sub.grade !== null ? (
        <div className="border-nexus-border bg-nexus-bg rounded-xl border p-5 text-center">
          <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
            Tu calificación
          </p>
          <p
            className={cn(
              'mt-1 text-4xl font-bold tabular-nums',
              gradeColor(sub.grade, settings.maxScore, settings.passingScore)
            )}
          >
            {sub.grade}
            <span className="text-nexus-muted text-lg"> / {settings.maxScore}</span>
          </p>
          {settings.passingScore !== null && (
            <p className="text-nexus-muted mt-1 text-xs">Nota mínima: {settings.passingScore}%</p>
          )}
        </div>
      ) : !isAutomatic ? (
        <div className="border-nexus-border bg-nexus-accent/5 flex items-center gap-3 rounded-xl border px-4 py-4">
          <Clock className="text-nexus-accent h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-nexus-text text-sm font-semibold">Tu entrega está siendo revisada</p>
            <p className="text-nexus-muted text-xs">
              El instructor calificará tu trabajo próximamente.
            </p>
          </div>
        </div>
      ) : null}

      {/* Feedback */}
      {sub.feedback && (
        <div className="space-y-1">
          <p className="text-nexus-muted text-xs font-semibold tracking-wide uppercase">
            Retroalimentación
          </p>
          <p className="border-nexus-border bg-nexus-bg text-nexus-text rounded-xl border px-4 py-3 text-sm leading-relaxed">
            {sub.feedback}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setLastSubmission(null)
            setPhase('instructions')
          }}
          className="border-nexus-border text-nexus-muted hover:text-nexus-text"
        >
          Ver mis entregas
        </Button>
        {nextLessonHref && (
          <Link
            href={nextLessonHref}
            className={buttonVariants({
              className: 'bg-nexus-accent hover:bg-nexus-accent-hover text-white',
            })}
          >
            Siguiente lección
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}
