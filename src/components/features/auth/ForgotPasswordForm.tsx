'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
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
import { useForgotPasswordMutation } from '@/hooks/mutations/auth'

const schema = z.object({
  email: z.string().email('Ingresá un email válido'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const { mutate, isPending } = useForgotPasswordMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: FormValues) {
    mutate(values.email, {
      // Always show the same success state regardless of outcome — never reveal
      // whether an email address is registered (email enumeration prevention).
      onSuccess: () => setSent(true),
      onError: () => setSent(true),
    })
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="text-nexus-success h-10 w-10" aria-hidden="true" />
          <p className="text-nexus-text text-sm leading-relaxed">
            Si el email existe, recibirás instrucciones para recuperar tu contraseña.
          </p>
        </div>
        <Link
          href="/login"
          className="text-nexus-accent hover:text-nexus-accent-hover block text-center text-sm font-medium transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

        <Button
          type="submit"
          disabled={isPending}
          className="bg-nexus-accent hover:bg-nexus-accent-hover w-full font-semibold text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            'Enviar instrucciones'
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
