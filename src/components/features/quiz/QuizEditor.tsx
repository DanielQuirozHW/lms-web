'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  AlignLeft,
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { QuestionForm } from './QuestionForm'
import { cn } from '@/lib/utils'
import { useQuizSettings, useQuizQuestions } from '@/hooks/queries/quiz'
import { useUpsertQuizSettings, useDeleteQuestion } from '@/hooks/mutations/quiz'
import type { Question, QuestionType } from '@/types/models'

// ─── Type icons ───────────────────────────────────────────────────────────────

const typeIcon: Record<QuestionType, React.ElementType> = {
  SINGLE_CHOICE: PlayCircle,
  MULTIPLE_CHOICE: ClipboardList,
  TRUE_FALSE: HelpCircle,
  SHORT_TEXT: FileText,
  LONG_TEXT: AlignLeft,
}

const typeLabel: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Única',
  MULTIPLE_CHOICE: 'Múltiple',
  TRUE_FALSE: 'V/F',
  SHORT_TEXT: 'Texto corto',
  LONG_TEXT: 'Texto largo',
}

// ─── Settings schema ──────────────────────────────────────────────────────────

const settingsSchema = z.object({
  maxAttempts: z.number().int().positive().nullable(),
  passingScore: z.number().min(0).max(100).nullable(),
  blocksProgress: z.boolean(),
  shuffleQuestions: z.boolean(),
})

type SettingsValues = z.infer<typeof settingsSchema>

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

// ─── Main component ───────────────────────────────────────────────────────────

interface QuizEditorProps {
  lessonId: string
}

export function QuizEditor({ lessonId }: QuizEditorProps) {
  const [localQuestions, setLocalQuestions] = useState<Question[] | null>(null)
  const [questionFormState, setQuestionFormState] = useState<{ question?: Question } | null>(null)
  const [dragSrc, setDragSrc] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const { data: settings, isLoading: settingsLoading } = useQuizSettings(lessonId)
  const { data: rawQuestions, isLoading: questionsLoading } = useQuizQuestions(lessonId)
  const { mutate: upsertSettings, isPending: isSavingSettings } = useUpsertQuizSettings(lessonId)
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion(lessonId)

  const displayQuestions = localQuestions ?? rawQuestions ?? []

  // Sync local state from server when raw questions arrive (if not yet set)
  if (rawQuestions && localQuestions === null) {
    setLocalQuestions([...rawQuestions].sort((a, b) => a.order - b.order))
  }

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      maxAttempts: settings?.maxAttempts ?? null,
      passingScore: settings?.passingScore ?? null,
      blocksProgress: settings?.blocksProgress ?? false,
      shuffleQuestions: settings?.shuffleQuestions ?? false,
    },
  })

  const blocksProgress = useWatch({
    control: form.control,
    name: 'blocksProgress',
    defaultValue: false,
  })
  const shuffleQuestions = useWatch({
    control: form.control,
    name: 'shuffleQuestions',
    defaultValue: false,
  })

  function onSaveSettings(values: SettingsValues) {
    upsertSettings(values, {
      onSuccess: () => toast.success('Configuración guardada'),
      onError: () => toast.error('No se pudo guardar la configuración'),
    })
  }

  function handleDeleteQuestion(questionId: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    deleteQuestion(questionId, {
      onSuccess: () => {
        toast.success('Pregunta eliminada')
        setLocalQuestions((prev) => prev?.filter((q) => q.id !== questionId) ?? null)
      },
      onError: () => toast.error('No se pudo eliminar la pregunta'),
    })
  }

  function handleQuestionSaved(q: Question) {
    setLocalQuestions((prev) => {
      if (!prev) return [q]
      const existing = prev.find((p) => p.id === q.id)
      if (existing) return prev.map((p) => (p.id === q.id ? q : p))
      return [...prev, q]
    })
  }

  // DnD (local reorder only — no reorder API in spec)
  function handleDrop(targetIndex: number) {
    if (dragSrc === null || dragSrc === targetIndex) {
      setDragSrc(null)
      setDragOver(null)
      return
    }
    const updated = [...displayQuestions]
    const [moved] = updated.splice(dragSrc, 1)
    updated.splice(targetIndex, 0, moved)
    setLocalQuestions(updated)
    setDragSrc(null)
    setDragOver(null)
  }

  const totalPoints = displayQuestions.reduce((sum, q) => sum + q.points, 0)

  if (settingsLoading || questionsLoading) {
    return <LoadingSpinner rows={3} />
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <section>
        <h3 className="text-nexus-text mb-3 text-sm font-semibold">Configuración del quiz</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSaveSettings)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-3">
              {/* blocksProgress toggle */}
              <label className="border-nexus-border bg-nexus-bg flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-nexus-text text-sm">Bloquea el progreso hasta aprobar</span>
                <input
                  type="checkbox"
                  checked={blocksProgress}
                  onChange={(e) => form.setValue('blocksProgress', e.target.checked)}
                  className="accent-nexus-accent h-4 w-4"
                />
              </label>
              {/* shuffleQuestions toggle */}
              <label className="border-nexus-border bg-nexus-bg flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-nexus-text text-sm">Aleatorizar preguntas</span>
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => form.setValue('shuffleQuestions', e.target.checked)}
                  className="accent-nexus-accent h-4 w-4"
                />
              </label>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSavingSettings}
              className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
            >
              {isSavingSettings ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Guardar configuración
            </Button>
          </form>
        </Form>
      </section>

      {/* Questions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-nexus-text text-sm font-semibold">
            Preguntas{' '}
            <span className="text-nexus-muted font-normal">
              ({displayQuestions.length} · {totalPoints} pts)
            </span>
          </h3>
          <Button
            size="sm"
            onClick={() => setQuestionFormState({})}
            className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Agregar
          </Button>
        </div>

        {displayQuestions.length === 0 ? (
          <p className="text-nexus-muted py-4 text-center text-sm">
            Sin preguntas. Usá el botón &ldquo;Agregar&rdquo; para empezar.
          </p>
        ) : (
          <ul className="space-y-2">
            {displayQuestions.map((q, qi) => {
              const Icon = typeIcon[q.type]
              return (
                <li
                  key={q.id}
                  draggable
                  onDragStart={() => setDragSrc(qi)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(qi)
                  }}
                  onDrop={() => handleDrop(qi)}
                  onDragEnd={() => {
                    setDragSrc(null)
                    setDragOver(null)
                  }}
                  className={cn(
                    'border-nexus-border bg-nexus-card flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                    dragOver === qi && dragSrc !== qi && 'border-nexus-accent',
                    dragSrc === qi && 'opacity-50'
                  )}
                >
                  <div className="text-nexus-muted/40 cursor-grab">
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-nexus-muted w-5 shrink-0 text-right text-xs tabular-nums">
                    {qi + 1}.
                  </span>
                  <Icon className="text-nexus-muted h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-nexus-text truncate text-sm">{q.text}</p>
                    <p className="text-nexus-muted text-[10px]">
                      {typeLabel[q.type]} · {q.points} pt{q.points !== 1 && 's'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setQuestionFormState({ question: q })}
                      className="text-nexus-muted hover:text-nexus-text h-7 px-2"
                      aria-label="Editar pregunta"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={isDeleting}
                      className="text-nexus-muted hover:text-destructive h-7 px-2"
                      aria-label="Eliminar pregunta"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Question form modal */}
      {questionFormState !== null && (
        <QuestionForm
          lessonId={lessonId}
          question={questionFormState.question}
          onClose={() => setQuestionFormState(null)}
          onSuccess={handleQuestionSaved}
        />
      )}
    </div>
  )
}
