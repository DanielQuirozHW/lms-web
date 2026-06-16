import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/features/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recuperar contraseña | NexusLMS',
  description: 'Ingresá tu email y te enviaremos instrucciones para recuperar tu contraseña.',
  openGraph: {
    title: 'Recuperar contraseña | NexusLMS',
    description: 'Ingresá tu email y te enviaremos instrucciones para recuperar tu contraseña.',
    type: 'website',
  },
}

// ─── Left branding panel ──────────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <aside
      className="bg-nexus-card hidden flex-col items-center justify-center gap-10 p-12 lg:flex lg:w-[45%]"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <svg
            width="44"
            height="44"
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
          <span className="text-nexus-text text-2xl font-bold tracking-tight">
            Nexus<span className="text-nexus-accent">LMS</span>
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-nexus-text text-2xl leading-snug font-bold">
            El conocimiento al
            <br />
            alcance de todos
          </h2>
          <p className="text-nexus-muted mt-3 text-sm leading-relaxed">
            Aprendé con los mejores cursos, certificados por expertos de la industria. Avanzá a tu
            ritmo, desde cualquier lugar.
          </p>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-4" role="list">
        <li className="flex items-center gap-3">
          <span className="bg-nexus-accent h-2 w-2 shrink-0 rounded-full" />
          <span className="text-nexus-text text-sm">+500 cursos disponibles</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="bg-nexus-success h-2 w-2 shrink-0 rounded-full" />
          <span className="text-nexus-text text-sm">Certificados reconocidos</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="bg-nexus-accent-hover h-2 w-2 shrink-0 rounded-full" />
          <span className="text-nexus-text text-sm">Comunidad activa de estudiantes</span>
        </li>
      </ul>
    </aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen">
      <BrandingPanel />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden" aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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

        {/* Form card */}
        <div className="w-full max-w-100 space-y-6">
          <div>
            <h1 className="text-nexus-text text-2xl font-bold">Recuperar contraseña</h1>
            <p className="text-nexus-muted mt-1 text-sm">
              Ingresá tu email y te enviaremos instrucciones para recuperarla
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </main>
    </div>
  )
}
