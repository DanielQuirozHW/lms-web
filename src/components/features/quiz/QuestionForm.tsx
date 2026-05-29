'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  X,
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
import { cn } from '@/lib/utils'
import { useCreateQuestion, useUpdateQuestion } from '@/hooks/mutations/quiz'
import type { Question, QuestionType } from '@/types/models'

// ─── Schema ───────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_TEXT',
  'LONG_TEXT',
] as const

const optionSchema = z.object({
  text: z.string().min(1, 'El texto es requerido'),
  isCorrect: z.boolean(),
})

const schema = z
  .object({
    text: z.string().min(1, 'El texto de la pregunta es requerido'),
    type: z.enum(QUESTION_TYPES),
    points: z.number().int().min(1, 'Mínimo 1 punto'),
    options: z.array(optionSchema),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'SHORT_TEXT' || data.type === 'LONG_TEXT') return
    const opts = data.options
    if (data.type === 'TRUE_FALSE') {
      if (opts.length !== 2) {
        ctx.addIssue({
          code: 'custom',
          message: 'TRUE/FALSE necesita exactamente 2 opciones',
          path: ['options'],
        })
        return
      }
    } else if (opts.length < 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'Se necesitan al menos 2 opciones',
        path: ['options'],
      })
      return
    }
    const correctCount = opts.filter((o) => o.isCorrect).length
    if (data.type === 'SINGLE_CHOICE' && correctCount !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Marcá exactamente 1 opción correcta',
        path: ['options'],
      })
    } else if (data.type === 'MULTIPLE_CHOICE' && correctCount < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Marcá al menos 1 opción correcta',
        path: ['options'],
      })
    } else if (data.type === 'TRUE_FALSE' && correctCount !== 1) {
      ctx.addIssue({ code: 'custom', message: 'Marcá cuál opción es correcta', path: ['options'] })
    }
  })

type FormValues = z.infer<typeof schema>

// ─── Type selector ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: React.ElementType }[] = [
  { value: 'SINGLE_CHOICE', label: 'Única', icon: PlayCircle },
  { value: 'MULTIPLE_CHOICE', label: 'Múltiple', icon: ClipboardList },
  { value: 'TRUE_FALSE', label: 'V/F', icon: HelpCircle },
  { value: 'SHORT_TEXT', label: 'Corta', icon: FileText },
  { value: 'LONG_TEXT', label: 'Larga', icon: AlignLeft },
]

const TRUE_FALSE_DEFAULTS = [
  { text: 'Verdadero', isCorrect: false },
  { text: 'Falso', isCorrect: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface QuestionFormProps {
  lessonId: string
  question?: Question
  onClose: () => void
  onSuccess: (q: Question) => void
}

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function QuestionForm({ lessonId, question, onClose, onSuccess }: QuestionFormProps) {
  const isEdit = !!question
  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion(lessonId)
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion(lessonId)
  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: question?.text ?? '',
      type: question?.type ?? 'SINGLE_CHOICE',
      points: question?.points ?? 1,
      options: question?.options?.length
        ? question.options
            .sort((a, b) => a.order - b.order)
            .map((o) => ({ text: o.text, isCorrect: o.isCorrect ?? false }))
        : [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'options',
  })

  const questionType = useWatch({
    control: form.control,
    name: 'type',
    defaultValue: question?.type ?? 'SINGLE_CHOICE',
  })

  // When type changes, reset options appropriately
  useEffect(() => {
    if (questionType === 'TRUE_FALSE') {
      replace(TRUE_FALSE_DEFAULTS)
    } else if (questionType === 'SHORT_TEXT' || questionType === 'LONG_TEXT') {
      replace([])
    } else if (fields.length < 2) {
      replace([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionType])

  // Watch the entire options array so checkboxes re-render on change.
  // useWatch avoids the React Compiler warning from calling form.watch() inside JSX.
  const watchedOptions = useWatch({ control: form.control, name: 'options', defaultValue: [] })

  const showOptions = questionType !== 'SHORT_TEXT' && questionType !== 'LONG_TEXT'
  const isTrueFalse = questionType === 'TRUE_FALSE'
  const canAddOption = !isTrueFalse && fields.length < 6

  function onSubmit(values: FormValues) {
    const data = {
      text: values.text,
      type: values.type,
      points: values.points,
      options:
        values.type === 'SHORT_TEXT' || values.type === 'LONG_TEXT' ? undefined : values.options,
    }

    if (isEdit && question) {
      updateQuestion(
        { questionId: question.id, data },
        {
          onSuccess: (updated) => {
            toast.success('Pregunta actualizada')
            onSuccess(updated)
            onClose()
          },
          onError: () => toast.error('No se pudo actualizar la pregunta'),
        }
      )
    } else {
      createQuestion(data, {
        onSuccess: (created) => {
          toast.success('Pregunta creada')
          onSuccess(created)
          onClose()
        },
        onError: () => toast.error('No se pudo crear la pregunta'),
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div className="border-nexus-border bg-nexus-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-nexus-border flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h2 id="question-form-title" className="text-nexus-text text-base font-semibold">
            {isEdit ? 'Editar pregunta' : 'Nueva pregunta'}
          </h2>
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
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form
              id="question-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* Question text */}
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">
                      Texto de la pregunta
                    </FormLabel>
                    <FormControl>
                      <textarea
                        rows={3}
                        placeholder="¿Cuál de las siguientes...?"
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

              {/* Type + Points row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-nexus-text font-medium">Tipo</FormLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            aria-pressed={field.value === value}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                              field.value === value
                                ? 'border-nexus-accent bg-nexus-accent-muted text-nexus-accent'
                                : 'border-nexus-border bg-nexus-bg text-nexus-muted hover:border-nexus-accent/50 hover:text-nexus-text'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem className="min-w-[80px]">
                      <FormLabel className="text-nexus-text font-medium">Puntos</FormLabel>
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
              </div>

              {/* Options */}
              {showOptions && (
                <div className="space-y-2">
                  <p className="text-nexus-text text-sm font-medium">
                    Opciones{' '}
                    {!isTrueFalse && <span className="text-nexus-muted font-normal">(máx. 6)</span>}
                  </p>

                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        {/* Correct checkbox */}
                        <input
                          type={questionType === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                          name="correct-option"
                          checked={watchedOptions[index]?.isCorrect ?? false}
                          onChange={() => {
                            if (questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') {
                              // Uncheck all others
                              fields.forEach((_, i) => {
                                form.setValue(`options.${i}.isCorrect`, i === index)
                              })
                            } else {
                              form.setValue(
                                `options.${index}.isCorrect`,
                                !form.getValues(`options.${index}.isCorrect`)
                              )
                            }
                          }}
                          aria-label={`Opción ${index + 1} correcta`}
                          className="accent-nexus-accent h-4 w-4 shrink-0"
                        />

                        {/* Option text */}
                        {isTrueFalse ? (
                          <span className="text-nexus-text border-nexus-border bg-nexus-bg flex-1 rounded-lg border px-3 py-2 text-sm">
                            {field.text}
                          </span>
                        ) : (
                          <FormField
                            control={form.control}
                            name={`options.${index}.text`}
                            render={({ field: f }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder={`Opción ${index + 1}`}
                                    className={inputClass}
                                    {...f}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Remove button */}
                        {!isTrueFalse && fields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Eliminar opción ${index + 1}`}
                            className="text-nexus-muted hover:text-destructive shrink-0 transition-colors"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add option */}
                  {canAddOption && (
                    <button
                      type="button"
                      onClick={() => append({ text: '', isCorrect: false })}
                      className="text-nexus-muted hover:text-nexus-accent flex items-center gap-1 text-xs transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Agregar opción
                    </button>
                  )}

                  {/* Options root error */}
                  {form.formState.errors.options?.root && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.options.root.message}
                    </p>
                  )}
                  {typeof form.formState.errors.options?.message === 'string' && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.options.message}
                    </p>
                  )}
                </div>
              )}
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
            form="question-form"
            disabled={isPending}
            className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isEdit ? 'Guardar pregunta' : 'Crear pregunta'}
          </Button>
        </div>
      </div>
    </div>
  )
}
