'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
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
import {
  useCreateGlobalAnnouncement,
  useUpdateGlobalAnnouncement,
} from '@/hooks/mutations/announcements-global'
import type { GlobalAnnouncement, GlobalAnnouncementType } from '@/types/models'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  message: z.string().min(1, 'El mensaje es requerido'),
  type: z.enum(['INFO', 'WARNING', 'MAINTENANCE', 'SUCCESS'] as const),
  isActive: z.boolean(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const typeOptions: { value: GlobalAnnouncementType; label: string; className: string }[] = [
  { value: 'INFO', label: 'Info', className: 'text-blue-400' },
  { value: 'WARNING', label: 'Advertencia', className: 'text-amber-400' },
  { value: 'MAINTENANCE', label: 'Mantenimiento', className: 'text-red-400' },
  { value: 'SUCCESS', label: 'Éxito', className: 'text-nexus-success' },
]

const inputClass =
  'border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50'

interface AnnouncementFormDialogProps {
  announcement?: GlobalAnnouncement
  onClose: () => void
}

export function AnnouncementFormDialog({ announcement, onClose }: AnnouncementFormDialogProps) {
  const isEdit = !!announcement
  const { mutate: create, isPending: isCreating } = useCreateGlobalAnnouncement()
  const { mutate: update, isPending: isUpdating } = useUpdateGlobalAnnouncement()
  const isPending = isCreating || isUpdating

  function toLocalDatetime(iso: string | null | undefined): string {
    if (!iso) return ''
    // Convert ISO to datetime-local input format (strip seconds/ms)
    return iso.slice(0, 16)
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: announcement?.title ?? '',
      message: announcement?.message ?? '',
      type: announcement?.type ?? 'INFO',
      isActive: announcement?.isActive ?? true,
      startsAt: toLocalDatetime(announcement?.startsAt),
      endsAt: toLocalDatetime(announcement?.endsAt),
    },
  })

  // Reset form when announcement prop changes
  useEffect(() => {
    form.reset({
      title: announcement?.title ?? '',
      message: announcement?.message ?? '',
      type: announcement?.type ?? 'INFO',
      isActive: announcement?.isActive ?? true,
      startsAt: toLocalDatetime(announcement?.startsAt),
      endsAt: toLocalDatetime(announcement?.endsAt),
    })
  }, [announcement, form])

  function onSubmit(values: FormValues) {
    const payload = {
      title: values.title,
      message: values.message,
      type: values.type,
      isActive: values.isActive,
      startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    }

    if (isEdit && announcement) {
      update({ id: announcement.id, data: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="bg-nexus-card border-nexus-border relative z-10 w-full max-w-lg rounded-xl border shadow-2xl">
        {/* Header */}
        <div className="border-nexus-border flex items-center justify-between border-b px-6 py-4">
          <h2 id="announcement-dialog-title" className="text-nexus-text text-lg font-semibold">
            {isEdit ? 'Editar alerta' : 'Nueva alerta'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-nexus-muted hover:text-nexus-text transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
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
                        placeholder="Ej: Mantenimiento programado"
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive text-xs" />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">Mensaje</FormLabel>
                    <FormControl>
                      <textarea
                        rows={3}
                        placeholder="Describí el alcance de la alerta..."
                        className={cn(
                          inputClass,
                          'flex w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive text-xs" />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">Tipo</FormLabel>
                    <FormControl>
                      <select
                        className={cn(
                          inputClass,
                          'flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                        )}
                        {...field}
                      >
                        {typeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage className="text-destructive text-xs" />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-nexus-text font-medium">
                        Inicio (opcional)
                      </FormLabel>
                      <FormControl>
                        <input
                          type="datetime-local"
                          className={cn(
                            inputClass,
                            'flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                          )}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-nexus-text font-medium">Fin (opcional)</FormLabel>
                      <FormControl>
                        <input
                          type="datetime-local"
                          className={cn(
                            inputClass,
                            'flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                          )}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* isActive */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={field.value}
                        onChange={field.onChange}
                        className="accent-nexus-accent h-4 w-4 rounded"
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="isActive"
                      className="text-nexus-text mb-0 cursor-pointer font-medium"
                    >
                      Activa
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
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
                      Guardando...
                    </>
                  ) : isEdit ? (
                    'Guardar cambios'
                  ) : (
                    'Crear alerta'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
