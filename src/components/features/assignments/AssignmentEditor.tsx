'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, Clock } from 'lucide-react'
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
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { GradeSubmissionDialog } from './GradeSubmissionDialog'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { useAssignmentSettings } from '@/hooks/queries/assignments'
import { useAllSubmissions } from '@/hooks/queries/assignments'
import { useUpsertAssignmentSettings } from '@/hooks/mutations/assignments'
import type { SubmissionWithStudent } from '@/hooks/queries/assignments'
import type { GradingType } from '@/types/models'

// ─── Schema ───────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  gradingType: z.enum(['AUTOMATIC', 'MANUAL'] as const),
  maxScore: z.number().int().min(1, 'Mínimo 1 punto'),
  passingScore: z.number().min(0).max(100).nullable(),
  dueDate: z.string().optional(),
  allowLateSubmission: z.boolean(),
  maxAttempts: z.number().int().positive().nullable(),
})

type SettingsValues = z.infer<typeof schema>
const schema = settingsSchema

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

// ─── Component ────────────────────────────────────────────────────────────────

interface AssignmentEditorProps {
  lessonId: string
}

type SubmissionsTab = 'all' | 'pending'

export function AssignmentEditor({ lessonId }: AssignmentEditorProps) {
  const [activeTab, setActiveTab] = useState<SubmissionsTab>('all')
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionWithStudent | null>(null)

  const { data: settings, isLoading: settingsLoading } = useAssignmentSettings(lessonId)
  const { data: allSubmissions, isLoading: submissionsLoading } = useAllSubmissions(lessonId)
  const { mutate: upsertSettings, isPending: isSaving } = useUpsertAssignmentSettings(lessonId)

  const pendingSubmissions = allSubmissions?.filter((s) => s.grade === null) ?? []
  const displaySubmissions = activeTab === 'pending' ? pendingSubmissions : (allSubmissions ?? [])

  const form = useForm<SettingsValues>({
    resolver: zodResolver(schema),
    values: {
      gradingType: (settings?.gradingType ?? 'MANUAL') as GradingType,
      maxScore: settings?.maxScore ?? 100,
      passingScore: settings?.passingScore ?? null,
      dueDate: settings?.dueDate ? new Date(settings.dueDate).toISOString().split('T')[0] : '',
      allowLateSubmission: settings?.allowLateSubmission ?? false,
      maxAttempts: settings?.maxAttempts ?? null,
    },
  })

  const gradingType = useWatch({
    control: form.control,
    name: 'gradingType',
    defaultValue: 'MANUAL' as GradingType,
  })
  const allowLate = useWatch({
    control: form.control,
    name: 'allowLateSubmission',
    defaultValue: false,
  })

  function onSaveSettings(values: SettingsValues) {
    upsertSettings(
      {
        ...values,
        dueDate: values.dueDate || null,
      },
      {
        onSuccess: () => toast.success('Configuración guardada'),
        onError: () => toast.error('No se pudo guardar la configuración'),
      }
    )
  }

  function getStudentName(sub: SubmissionWithStudent): string {
    if (sub.student) {
      return `${sub.student.firstName} ${sub.student.lastName}`.trim()
    }
    return `Inscripción ${sub.enrollmentId.slice(0, 6)}`
  }

  if (settingsLoading) return <LoadingSpinner rows={3} />

  return (
    <div className="space-y-6">
      {/* Settings */}
      <section>
        <h3 className="text-nexus-text mb-3 text-sm font-semibold">Configuración</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSaveSettings)} className="space-y-4" noValidate>
            {/* Grading type */}
            <FormField
              control={form.control}
              name="gradingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text text-xs font-medium">
                    Tipo de calificación
                  </FormLabel>
                  <div className="flex gap-2">
                    {(['MANUAL', 'AUTOMATIC'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        aria-pressed={field.value === type}
                        className={cn(
                          'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                          field.value === type
                            ? 'border-nexus-accent bg-nexus-accent-muted text-nexus-accent'
                            : 'border-nexus-border bg-nexus-bg text-nexus-muted hover:border-nexus-accent/50 hover:text-nexus-text'
                        )}
                      >
                        {type === 'MANUAL' ? 'Manual' : 'Automática'}
                      </button>
                    ))}
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text text-xs font-medium">
                      Puntuación máxima
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        className={inputClass}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? 1 : parseInt(e.target.value, 10))
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
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text text-xs font-medium">
                      Nota mínima (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Sin mínimo"
                        className={inputClass}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text text-xs font-medium">
                      Fecha límite
                    </FormLabel>
                    <FormControl>
                      <Input type="date" className={inputClass} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text text-xs font-medium">
                      Intentos máximos
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ilimitados"
                        className={inputClass}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : parseInt(e.target.value, 10)
                          )
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
            </div>

            {/* allowLateSubmission */}
            <label className="border-nexus-border bg-nexus-bg flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-nexus-text text-sm">Permitir entregas tardías</span>
              <input
                type="checkbox"
                checked={allowLate}
                onChange={(e) => form.setValue('allowLateSubmission', e.target.checked)}
                className="accent-nexus-accent h-4 w-4"
              />
            </label>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
            >
              {isSaving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Guardar configuración
            </Button>
          </form>
        </Form>
      </section>

      {/* Submissions */}
      <section>
        <div
          role="tablist"
          aria-label="Filtrar entregas"
          className="border-nexus-border mb-3 flex gap-0 border-b"
        >
          {(
            [
              { value: 'all', label: `Todas (${allSubmissions?.length ?? 0})` },
              { value: 'pending', label: `Pendientes (${pendingSubmissions.length})` },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              type="button"
              onClick={() => setActiveTab(value)}
              aria-selected={activeTab === value}
              className={cn(
                'shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === value
                  ? 'border-nexus-accent text-nexus-accent'
                  : 'text-nexus-muted hover:text-nexus-text border-transparent'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {submissionsLoading ? (
          <LoadingSpinner rows={2} />
        ) : displaySubmissions.length === 0 ? (
          <p className="text-nexus-muted py-6 text-center text-sm">
            {activeTab === 'pending' ? 'Sin entregas pendientes' : 'Sin entregas todavía'}
          </p>
        ) : (
          <div className="divide-nexus-border border-nexus-border divide-y rounded-xl border">
            {displaySubmissions.map((sub) => (
              <div key={sub.id} className="bg-nexus-card flex items-center gap-3 px-4 py-3">
                {sub.grade !== null ? (
                  <CheckCircle2
                    className="text-nexus-success h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock className="text-nexus-muted h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-nexus-text truncate text-sm font-medium">
                    {getStudentName(sub)}
                  </p>
                  <p className="text-nexus-muted text-xs">
                    Intento #{sub.attemptNumber} · {formatRelativeTime(sub.submittedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {sub.grade !== null ? (
                    <span className="text-nexus-text text-sm font-semibold tabular-nums">
                      {sub.grade} / {settings?.maxScore ?? '?'}
                    </span>
                  ) : (
                    <span className="text-nexus-muted text-xs">Sin calificar</span>
                  )}
                  {gradingType === 'MANUAL' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setGradingSubmission(sub)}
                      className="border-nexus-border text-nexus-muted hover:text-nexus-text h-7 px-2 text-xs"
                    >
                      {sub.grade !== null ? 'Editar' : 'Calificar'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Grade dialog */}
      {gradingSubmission && settings && (
        <GradeSubmissionDialog
          lessonId={lessonId}
          submission={gradingSubmission}
          maxScore={settings.maxScore}
          onClose={() => setGradingSubmission(null)}
          onSuccess={() => setGradingSubmission(null)}
        />
      )}
    </div>
  )
}
