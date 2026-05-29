'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { useMaintenanceStatus, useToggleMaintenance } from '@/hooks/mutations/maintenance'

const schema = z.object({
  message: z.string().optional(),
  estimatedEnd: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inputClass =
  'border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50'

export function MaintenanceToggle() {
  const { data: status, isLoading } = useMaintenanceStatus()
  const { mutate: toggle, isPending } = useToggleMaintenance()
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: '',
      estimatedEnd: '',
    },
  })

  function handleToggle() {
    if (status?.isEnabled) {
      // Disabling — no confirmation needed
      toggle({ isEnabled: false })
    } else {
      // Enabling — show confirmation with form
      setShowConfirm(true)
    }
  }

  function handleConfirmEnable(values: FormValues) {
    toggle(
      {
        isEnabled: true,
        message: values.message || null,
        estimatedEnd: values.estimatedEnd ? new Date(values.estimatedEnd).toISOString() : null,
      },
      {
        onSuccess: () => {
          setShowConfirm(false)
          form.reset()
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="text-nexus-muted h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-nexus-muted text-sm">Cargando estado...</span>
        </div>
      </div>
    )
  }

  const isEnabled = status?.isEnabled ?? false

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isEnabled ? 'bg-red-500/15 text-red-400' : 'bg-nexus-muted/10 text-nexus-muted'
              )}
            >
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-nexus-text font-semibold">Modo mantenimiento</p>
              <p className="text-nexus-muted mt-0.5 text-sm">
                {isEnabled
                  ? status?.message || 'Activo — todos los usuarios son redirigidos'
                  : 'Desactivado — la plataforma funciona normalmente'}
              </p>
              {isEnabled && status?.estimatedEnd && (
                <p className="text-nexus-muted mt-1 text-xs">
                  Fin estimado: {new Date(status.estimatedEnd).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                isEnabled ? 'bg-red-500/15 text-red-400' : 'bg-nexus-muted/10 text-nexus-muted'
              )}
            >
              {isEnabled ? 'ACTIVO' : 'INACTIVO'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={handleToggle}
              disabled={isPending || showConfirm}
              className={cn(
                'focus:ring-nexus-accent relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:ring-2 focus:outline-none disabled:opacity-50',
                isEnabled ? 'bg-red-500' : 'bg-nexus-border'
              )}
            >
              {isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
              ) : (
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                    isEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  )}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation panel — shown when admin wants to enable maintenance */}
      {showConfirm && (
        <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <p className="text-sm text-amber-400">
              <span className="font-semibold">Atención:</span> Todos los usuarios (excepto admins)
              serán redirigidos a la página de mantenimiento.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleConfirmEnable)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">
                      Mensaje (opcional)
                    </FormLabel>
                    <FormControl>
                      <textarea
                        rows={2}
                        placeholder="Ej: Estamos actualizando la base de datos"
                        className={cn(
                          inputClass,
                          'flex w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                        )}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">
                      Fin estimado (opcional)
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

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowConfirm(false)
                    form.reset()
                  }}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Activando...
                    </>
                  ) : (
                    'Activar mantenimiento'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  )
}
