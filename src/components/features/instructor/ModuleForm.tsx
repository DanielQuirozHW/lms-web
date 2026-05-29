'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { useCreateModule, useUpdateModule } from '@/hooks/mutations/modules'
import type { CourseModule } from '@/types/models'

const schema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  unlockAfterDays: z.number().int().nonnegative('Debe ser 0 o más días').optional(),
})

type FormValues = z.infer<typeof schema>

interface ModuleFormProps {
  courseId: string
  moduleId?: string
  initialData?: CourseModule
  onSuccess: (module: CourseModule) => void
  onCancel: () => void
}

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function ModuleForm({
  courseId,
  moduleId,
  initialData,
  onSuccess,
  onCancel,
}: ModuleFormProps) {
  const isEdit = !!moduleId

  const { mutate: createModule, isPending: isCreating } = useCreateModule(courseId)
  const { mutate: updateModule, isPending: isUpdating } = useUpdateModule(courseId, moduleId ?? '')

  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      unlockAfterDays: initialData?.unlockAfterDays ?? undefined,
    },
  })

  function onSubmit(values: FormValues) {
    const data = {
      title: values.title,
      description: values.description || undefined,
      unlockAfterDays: values.unlockAfterDays,
    }

    if (isEdit) {
      updateModule(data, {
        onSuccess: (mod) => {
          toast.success('Módulo actualizado')
          onSuccess(mod)
        },
        onError: () => toast.error('No se pudo actualizar el módulo'),
      })
    } else {
      createModule(data, {
        onSuccess: (mod) => {
          toast.success('Módulo creado')
          form.reset()
          onSuccess(mod)
        },
        onError: () => toast.error('No se pudo crear el módulo'),
      })
    }
  }

  return (
    <div className="border-nexus-border bg-nexus-bg rounded-xl border p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Título del módulo</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Módulo 1: Introducción"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unlockAfterDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Desbloquear después de{' '}
                    <span className="text-nexus-muted font-normal">(días, opcional)</span>
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
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-nexus-text font-medium">
                  Descripción <span className="text-nexus-muted font-normal">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    placeholder="Descripción breve del módulo..."
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
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
              {isEdit ? 'Guardar módulo' : 'Crear módulo'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
