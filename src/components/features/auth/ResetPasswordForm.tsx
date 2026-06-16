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
import { useResetPasswordMutation } from '@/hooks/mutations/auth'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate, isPending } = useResetPasswordMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  function onSubmit(values: FormValues) {
    mutate(
      { token, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Contraseña restablecida. Ya podés iniciar sesión.')
          router.push('/login')
        },
        onError: () => {
          form.setError('root', { message: 'El enlace expiró o ya fue usado.' })
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50 pr-10"
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
              <FormMessage className="text-destructive text-xs" />
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
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repetí tu nueva contraseña"
                    autoComplete="new-password"
                    className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus-visible:ring-nexus-accent/50 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="text-nexus-muted hover:text-nexus-text absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showConfirm ? (
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

        {/* Expired / used token error */}
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

        <Button
          type="submit"
          disabled={isPending}
          className="bg-nexus-accent hover:bg-nexus-accent-hover w-full font-semibold text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            'Restablecer contraseña'
          )}
        </Button>

        <p className="text-nexus-muted text-center text-sm">
          <Link
            href="/login"
            className="text-nexus-accent hover:text-nexus-accent-hover font-medium transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </Form>
  )
}
