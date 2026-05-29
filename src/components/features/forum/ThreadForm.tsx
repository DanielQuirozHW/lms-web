'use client'

import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
import { useCreateThread } from '@/hooks/mutations/forum'

const schema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200),
})

type FormValues = z.infer<typeof schema>

interface ThreadFormProps {
  courseId: string
  isOpen: boolean
  onClose: () => void
}

export function ThreadForm({ courseId, isOpen, onClose }: ThreadFormProps) {
  const { mutate, isPending } = useCreateThread()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  function onSubmit(values: FormValues) {
    mutate(
      { title: values.title, courseId },
      {
        onSuccess: () => {
          toast.success('Pregunta publicada')
          form.reset()
          onClose()
        },
        onError: () => toast.error('No se pudo publicar la pregunta'),
      }
    )
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thread-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div className="border-nexus-border bg-nexus-card w-full max-w-md rounded-2xl border p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="thread-form-title" className="text-nexus-text text-base font-semibold">
            Nueva pregunta
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Título de la pregunta
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="¿Cómo funciona...?"
                      autoFocus
                      className="border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
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
                disabled={isPending}
                className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Publicando...
                  </>
                ) : (
                  'Publicar pregunta'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
