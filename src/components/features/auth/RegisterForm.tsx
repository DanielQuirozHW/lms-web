'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { useRegisterMutation } from '@/hooks/mutations/auth'
import { isApiError } from '@/lib/api'
import { OAuthButtons } from './OAuthButtons'
import { cn } from '@/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

// ─── Password strength ────────────────────────────────────────────────────────

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
  medium: {
    label: 'Media',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-500',
    filledBars: 2,
  },
  strong: {
    label: 'Fuerte',
    barColor: 'bg-nexus-success',
    textColor: 'text-nexus-success',
    filledBars: 3,
  },
}

interface PasswordStrengthIndicatorProps {
  password: string
}

function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
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

// ─── Form ─────────────────────────────────────────────────────────────────────

const inputClass =
  'border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50'

export function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { mutate, isPending } = useRegisterMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = useWatch({ control: form.control, name: 'password', defaultValue: '' })

  function onSubmit(values: FormValues) {
    mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          router.push('/verify-email')
        },
        onError: (error) => {
          if (isApiError(error)) {
            const status = error.response?.data.statusCode
            if (status === 409) {
              form.setError('email', { message: 'Este email ya está en uso' })
            } else if (status === 400) {
              form.setError('root', { message: 'Datos inválidos. Revisá los campos.' })
            } else if (status === 429) {
              toast.error('Demasiados intentos. Esperá un momento.')
            } else {
              toast.error('Ocurrió un error. Intentá de nuevo.')
            }
          } else {
            toast.error('Ocurrió un error. Intentá de nuevo.')
          }
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* OAuth shortcut */}
        <p className="text-nexus-muted text-sm">
          ¿Ya tenés cuenta en Google o Microsoft? Ingresá directamente:
        </p>
        <OAuthButtons redirectTo="/dashboard" />

        {/* Form divider */}
        <div className="relative flex items-center gap-3" aria-hidden="true">
          <div className="bg-nexus-border h-px flex-1" />
          <span className="text-nexus-muted text-xs">o completá el formulario</span>
          <div className="bg-nexus-border h-px flex-1" />
        </div>

        {/* First name + Last name */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-nexus-text font-medium">Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Juan"
                    autoComplete="given-name"
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-nexus-text font-medium">Apellido</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Pérez"
                    autoComplete="family-name"
                    className={inputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-nexus-text font-medium">Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className={inputClass}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-nexus-text font-medium">Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={cn(inputClass, 'pr-10')}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="text-nexus-muted hover:text-nexus-text absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              <PasswordStrengthIndicator password={passwordValue} />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Confirm password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-nexus-text font-medium">Confirmar contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repetí tu contraseña"
                  autoComplete="new-password"
                  className={inputClass}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Root error */}
        {form.formState.errors.root && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2.5 text-sm font-medium"
          >
            {form.formState.errors.root.message}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-nexus-accent hover:bg-nexus-accent-hover w-full font-semibold text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center gap-3" aria-hidden="true">
          <div className="bg-nexus-border h-px flex-1" />
          <span className="text-nexus-muted text-xs">o</span>
          <div className="bg-nexus-border h-px flex-1" />
        </div>

        {/* Login link */}
        <p className="text-nexus-muted text-center text-sm">
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/login"
            className="text-nexus-accent hover:text-nexus-accent-hover font-medium transition-colors"
          >
            Ingresá
          </Link>
        </p>
      </form>
    </Form>
  )
}
