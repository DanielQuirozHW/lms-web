'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, RefreshCw, Key } from 'lucide-react'
import { toast } from 'sonner'
import api, { isApiError } from '@/lib/api'
import type { EnrollmentCode } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

// ─── Query keys ──────────────────────────────────────────────────────────────

const enrollmentCodeKeys = {
  list: (courseId: string) => ['enrollment-codes', courseId] as const,
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const createCodeSchema = z.object({
  code: z
    .string()
    .min(4, 'El código debe tener al menos 4 caracteres')
    .max(32, 'El código no puede superar 32 caracteres'),
  maxUses: z.number().int().min(1, 'Debe ser al menos 1').optional(),
  expiresAt: z.string().optional(),
})

type CreateCodeValues = z.infer<typeof createCodeSchema>

function generateCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

interface EnrollmentCodesManagerProps {
  courseId: string
}

export function EnrollmentCodesManager({ courseId }: EnrollmentCodesManagerProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  // ─── Query ────────────────────────────────────────────────────────────────────

  const { data: codes = [], isLoading } = useQuery({
    queryKey: enrollmentCodeKeys.list(courseId),
    queryFn: () =>
      api.get<EnrollmentCode[]>(`/courses/${courseId}/enrollment-codes`).then((r) => r.data),
    staleTime: 60 * 1000,
  })

  // ─── Mutations ────────────────────────────────────────────────────────────────

  const { mutate: createCode, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateCodeValues) =>
      api
        .post<EnrollmentCode>(`/courses/${courseId}/enrollment-codes`, {
          code: data.code,
          ...(data.maxUses != null ? { maxUses: data.maxUses } : {}),
          ...(data.expiresAt ? { expiresAt: `${data.expiresAt}T23:59:59.000Z` } : {}),
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Código creado')
      queryClient.invalidateQueries({ queryKey: enrollmentCodeKeys.list(courseId) })
      setShowForm(false)
      form.reset()
    },
    onError: (error) => {
      if (isApiError(error) && error.response?.data.statusCode === 409) {
        toast.error('Ya existe un código con ese nombre')
      } else {
        toast.error('No se pudo crear el código')
      }
    },
  })

  const { mutate: deleteCode } = useMutation({
    mutationFn: (codeId: string) => api.delete(`/courses/${courseId}/enrollment-codes/${codeId}`),
    onSuccess: () => {
      toast.success('Código eliminado')
      queryClient.invalidateQueries({ queryKey: enrollmentCodeKeys.list(courseId) })
    },
    onError: () => toast.error('No se pudo eliminar el código'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ codeId, isActive }: { codeId: string; isActive: boolean }) =>
      api
        .patch<EnrollmentCode>(`/courses/${courseId}/enrollment-codes/${codeId}`, { isActive })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentCodeKeys.list(courseId) })
    },
    onError: () => toast.error('No se pudo actualizar el código'),
  })

  // ─── Form ─────────────────────────────────────────────────────────────────────

  const form = useForm<CreateCodeValues>({
    resolver: zodResolver(createCodeSchema),
    defaultValues: { code: '', maxUses: undefined, expiresAt: '' },
  })

  function onSubmit(values: CreateCodeValues) {
    createCode(values)
  }

  function handleCancel() {
    setShowForm(false)
    form.reset()
  }

  return (
    <div className="border-nexus-border bg-nexus-card space-y-5 rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="text-nexus-accent h-4 w-4" aria-hidden="true" />
          <h2 className="text-nexus-text text-base font-semibold">Códigos de inscripción</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Crear código
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border-nexus-border bg-nexus-bg rounded-lg border p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Code */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="text-nexus-text text-xs font-medium">Código</FormLabel>
                      <FormControl>
                        <div className="flex gap-1.5">
                          <Input
                            {...field}
                            placeholder="ABC123"
                            className="border-nexus-border bg-nexus-card text-nexus-text focus-visible:ring-nexus-accent/50 font-mono text-sm uppercase"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => field.onChange(generateCode())}
                            className="border-nexus-border text-nexus-muted hover:text-nexus-text shrink-0"
                            aria-label="Generar código aleatorio"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Max uses */}
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-nexus-text text-xs font-medium">
                        Usos máx. <span className="text-nexus-muted font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Sin límite"
                          className="border-nexus-border bg-nexus-card text-nexus-text focus-visible:ring-nexus-accent/50"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            field.onChange(val === '' ? undefined : Number(val))
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

                {/* Expires at */}
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-nexus-text text-xs font-medium">
                        Vence <span className="text-nexus-muted font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="border-nexus-border bg-nexus-card text-nexus-text focus-visible:ring-nexus-accent/50"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="border-nexus-border text-nexus-muted"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating}
                  className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
                >
                  {isCreating ? 'Creando...' : 'Crear código'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Codes list */}
      {isLoading ? (
        <p className="text-nexus-muted text-sm">Cargando códigos...</p>
      ) : codes.length === 0 ? (
        <p className="text-nexus-muted text-sm">No hay códigos creados aún.</p>
      ) : (
        <div className="border-nexus-border divide-nexus-border divide-y overflow-hidden rounded-lg border">
          {codes.map((c) => (
            <div key={c.id} className="bg-nexus-bg flex flex-wrap items-center gap-3 px-4 py-3">
              <code className="text-nexus-text min-w-0 flex-1 truncate font-mono text-sm font-medium">
                {c.code}
              </code>
              <span className="text-nexus-muted shrink-0 text-xs">
                {c.usedCount}/{c.maxUses ?? '∞'} usos
              </span>
              {c.expiresAt && (
                <span className="text-nexus-muted shrink-0 text-xs">
                  vence {new Date(c.expiresAt).toLocaleDateString()}
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleActive({ codeId: c.id, isActive: !c.isActive })}
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors',
                  c.isActive
                    ? 'bg-nexus-success/15 text-nexus-success'
                    : 'bg-nexus-card text-nexus-muted'
                )}
                aria-pressed={c.isActive}
                aria-label={c.isActive ? 'Desactivar código' : 'Activar código'}
              >
                {c.isActive ? 'Activo' : 'Inactivo'}
              </button>
              <button
                type="button"
                onClick={() => deleteCode(c.id)}
                className="text-nexus-muted hover:text-nexus-danger shrink-0 transition-colors"
                aria-label={`Eliminar código ${c.code}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
