import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { VerifyEmailForm } from '@/components/features/auth/VerifyEmailForm'

export const metadata: Metadata = { title: 'Verificar email | NexusLMS' }

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2.5">
            <svg
              width="32"
              height="32"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M14 1.5L25.5 8v14L14 28.5 2.5 22V8L14 1.5z" fill="#4A7FD4" />
              <path
                d="M14 7.5l8.5 4.9V18L14 23l-8.5-4.9v-5.6L14 7.5z"
                fill="white"
                fillOpacity="0.18"
              />
            </svg>
            <span className="text-nexus-text text-xl font-bold tracking-tight">
              Nexus<span className="text-nexus-accent">LMS</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-nexus-card border-nexus-border space-y-6 rounded-2xl border p-8">
          {/* Mail icon + heading */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-nexus-accent/15 flex h-16 w-16 items-center justify-center rounded-full">
              <Mail className="text-nexus-accent h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-nexus-text text-2xl font-bold">Verificá tu email</h1>
              <p className="text-nexus-muted mt-2 text-sm leading-relaxed">
                Enviamos un código de 6 dígitos a tu email.
                <br />
                Ingresalo para activar tu cuenta.
              </p>
            </div>
          </div>

          <VerifyEmailForm />
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-nexus-muted hover:text-nexus-accent text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
