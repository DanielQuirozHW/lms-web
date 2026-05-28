'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
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
import { useChangePasswordMutation } from '@/hooks/mutations/users'
import { isApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Password strength (mirrors RegisterForm logic) ───────────────────────────

type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong'

function getStrength(password: string): PasswordStrength {
  if (!password) return 'empty'
  if (password.length < 8) return 'weak'
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  if (hasNumber && hasSpecial) return 'strong'
  return 'medium'
}

const strengthConfig: Record<
  Exclude<PasswordStrength, 'empty'>,
  { label: string; barColor: string; textColor: string; filledBars: number }
> = {
  weak: {
    label: 'Débil',
    barColor: 'bg-destructive',
    textColor: 'text-destructive',
    filledBars: 1,
  },
  medium: { label: 'Media', barColor: 'bg-amber-500', textColor: 'text-amber-500', filledBars: 2 },
  strong: {
    label: 'Fuerte',
    barColor: 'bg-nexus-success',
    textColor: 'text-nexus-success',
    filledBars: 3,
  },
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getStrength(password)
  if (strength === 'empty') return null
  const config = strengthConfig[strength]
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              bar <= config.filledBars ? config.barColor : 'bg-nexus-border'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs', config.textColor)} aria-live="polite">
        Seguridad: {config.label}
      </p>
    </div>
  )
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  })

type FormValues = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function PasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { mutate, isPending } = useChangePasswordMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  const newPasswordValue = useWatch({
    control: form.control,
    name: 'newPassword',
    defaultValue: '',
  })

  function onSubmit(values: FormValues) {
    mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada')
          form.reset()
        },
        onError: (error) => {
          if (isApiError(error) && error.response?.data.statusCode === 401) {
            form.setError('currentPassword', { message: 'Contraseña actual incorrecta' })
          } else {
            toast.error('No se pudo cambiar la contraseña. Intentá de nuevo.')
          }
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Current password */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-nexus-text font-medium">Contraseña actual</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn(inputClass, 'pr-10')}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="text-nexus-muted hover:text-nexus-text absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* New password */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-nexus-text font-medium">Nueva contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn(inputClass, 'pr-10')}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="text-nexus-muted hover:text-nexus-text absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              <PasswordStrengthIndicator password={newPasswordValue} />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Confirm new password */}
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-nexus-text font-medium">
                Confirmá la nueva contraseña
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Cambiando...
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
