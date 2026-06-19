'use client'

import { X, Loader2, PlayCircle, FileText, HelpCircle, ClipboardList } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateLesson, useUpdateLesson } from '@/hooks/mutations/modules'
import { RichTextEditor } from './RichTextEditor'
import type { LessonType } from '@/types/models'
import type { LessonWithDetails } from '@/hooks/queries/modules'

// ─── Schema ───────────────────────────────────────────────────────────────────

const LESSON_TYPES = ['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT'] as const

const schema = z
  .object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    type: z.enum(LESSON_TYPES),
    videoUrl: z.string().optional(),
    content: z.string().optional(),
    duration: z.number().int().nonnegative().optional(),
    isPreview: z.boolean(),
  })
  .refine((d) => !(d.type === 'VIDEO' && !d.videoUrl), {
    message: 'La URL del video es requerida',
    path: ['videoUrl'],
  })

type FormValues = z.infer<typeof schema>

// ─── Type selector ────────────────────────────────────────────────────────────

const typeOptions: { value: LessonType; label: string; icon: React.ElementType }[] = [
  { value: 'VIDEO', label: 'Video', icon: PlayCircle },
  { value: 'TEXT', label: 'Texto', icon: FileText },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle },
  { value: 'ASSIGNMENT', label: 'Tarea', icon: ClipboardList },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface LessonFormProps {
  courseId: string
  moduleId: string
  lesson?: LessonWithDetails
  onClose: () => void
  onSuccess: (lesson: LessonWithDetails) => void
}

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function LessonForm({ courseId, moduleId, lesson, onClose, onSuccess }: LessonFormProps) {
  const isEdit = !!lesson

  const { mutate: createLesson, isPending: isCreating } = useCreateLesson(courseId, moduleId)
  const { mutate: updateLesson, isPending: isUpdating } = useUpdateLesson(
    courseId,
    moduleId,
    lesson?.id ?? ''
  )

  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: lesson?.title ?? '',
      type: lesson?.type ?? 'VIDEO',
      videoUrl: lesson?.videoUrl ?? '',
      content: lesson?.content ?? '',
      duration: lesson?.duration ?? undefined,
      isPreview: lesson?.isPreview ?? false,
    },
  })

  const lessonType = useWatch({
    control: form.control,
    name: 'type',
    defaultValue: lesson?.type ?? 'VIDEO',
  })

  function onSubmit(values: FormValues) {
    const data = {
      title: values.title,
      type: values.type,
      videoUrl: values.type === 'VIDEO' ? values.videoUrl || undefined : undefined,
      content: values.type === 'TEXT' ? values.content || undefined : undefined,
      duration: values.duration,
      isPreview: values.isPreview,
    }

    if (isEdit) {
      updateLesson(data, {
        onSuccess: (updated) => {
          toast.success('Lección actualizada')
          onSuccess({ ...lesson, ...updated })
          onClose()
        },
        onError: () => toast.error('No se pudo actualizar la lección'),
      })
    } else {
      createLesson(data, {
        onSuccess: (created) => {
          toast.success('Lección creada')
          onSuccess(created as LessonWithDetails)
          onClose()
        },
        onError: () => toast.error('No se pudo crear la lección'),
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div
        className={cn(
          'border-nexus-border bg-nexus-card w-full rounded-2xl border p-6 shadow-2xl',
          lessonType === 'TEXT' ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 id="lesson-form-title" className="text-nexus-text text-base font-semibold">
            {isEdit ? 'Editar lección' : 'Agregar lección'}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Título</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Título de la lección"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Type selector */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Tipo</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {typeOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-pressed={field.value === value}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                          field.value === value
                            ? 'border-nexus-accent bg-nexus-accent-muted text-nexus-accent'
                            : 'border-nexus-border bg-nexus-bg text-nexus-muted hover:border-nexus-accent/50 hover:text-nexus-text'
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Video URL — only for VIDEO type */}
            {lessonType === 'VIDEO' && (
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">URL del video</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            {/* Content — only for TEXT type */}
            {lessonType === 'TEXT' && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">Contenido</FormLabel>
                    <RichTextEditor
                      value={field.value}
                      onChange={(html) => field.onChange(html)}
                      placeholder="Escribe el contenido de la lección…"
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            {/* Duration + isPreview */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">
                      Duración (seg){' '}
                      <span className="text-nexus-muted font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        className={inputClass}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === '' ? undefined : parseInt(val, 10))
                        }}
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
                name="isPreview"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 pb-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          id="isPreview"
                          checked={field.value}
                          onChange={field.onChange}
                          className="border-nexus-border accent-nexus-accent h-4 w-4 rounded"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="isPreview"
                        className="text-nexus-text cursor-pointer text-sm"
                      >
                        Vista previa gratuita
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="border-nexus-border text-nexus-muted"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {isEdit ? 'Guardar lección' : 'Crear lección'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
