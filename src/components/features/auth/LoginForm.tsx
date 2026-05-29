'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
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
import { useLoginMutation } from '@/hooks/mutations/auth'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

interface LoginFormProps {
  /** Pre-validated redirect path from the server. Must start with '/' and not
   *  start with '//' (no protocol-relative URLs). Defaults to '/dashboard'. */
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { mutate, isPending } = useLoginMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: FormValues) {
    mutate(values, {
      onSuccess: () => {
        router.push(redirectTo)
      },
      onError: (error) => {
        if (error instanceof Error && error.message === 'Invalid email or password') {
          form.setError('root', { message: 'Email o contraseña incorrectos' })
        } else {
          toast.error('Ocurrió un error. Intentá de nuevo.')
        }
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                  className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-destructive text-xs" />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-nexus-text font-medium">Contraseña</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-nexus-muted hover:text-nexus-accent text-xs transition-colors"
                  tabIndex={0}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="current-password"
                    className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50 pr-10"
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
              <FormMessage className="text-destructive text-xs" />
            </FormItem>
          )}
        />

        {/* Root / credential error */}
        {form.formState.errors.root && (
          <p
            role="alert"
            className={cn(
              'rounded-lg px-3 py-2.5 text-sm font-medium',
              'bg-destructive/10 text-destructive'
            )}
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
              Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center gap-3" aria-hidden="true">
          <div className="bg-nexus-border h-px flex-1" />
          <span className="text-nexus-muted text-xs">o</span>
          <div className="bg-nexus-border h-px flex-1" />
        </div>

        {/* Register link */}
        <p className="text-nexus-muted text-center text-sm">
          ¿No tenés cuenta?{' '}
          <Link
            href="/register"
            className="text-nexus-accent hover:text-nexus-accent-hover font-medium transition-colors"
          >
            Registrate
          </Link>
        </p>
      </form>
    </Form>
  )
}
