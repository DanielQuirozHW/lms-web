import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'
import { MaintenanceActions } from './_components/MaintenanceActions'

export const metadata: Metadata = {
  title: 'Mantenimiento | NexusLMS',
  description: 'La plataforma se encuentra temporalmente en mantenimiento.',
  robots: { index: false },
}

interface PageProps {
  searchParams: Promise<{ message?: string; estimatedEnd?: string }>
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const { message, estimatedEnd } = await searchParams

  const defaultMessage = 'Estamos realizando mejoras para brindarte una mejor experiencia.'
  const displayMessage = message && message.trim().length > 0 ? message.trim() : defaultMessage

  const endDate = estimatedEnd
    ? new Date(estimatedEnd).toLocaleString('es-AR', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="bg-nexus-bg flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <svg
          width="40"
          height="40"
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

      {/* Wrench icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15">
        <Wrench className="h-10 w-10 text-amber-500" aria-hidden="true" />
      </div>

      {/* Title */}
      <h1 className="text-nexus-text mb-3 text-3xl font-bold tracking-tight">
        Estamos realizando mantenimiento
      </h1>

      {/* Message */}
      <p className="text-nexus-muted mb-2 max-w-md text-base leading-relaxed">{displayMessage}</p>

      {/* Estimated end */}
      {endDate && (
        <p className="text-nexus-muted mb-8 text-sm">
          Volvemos el <span className="text-nexus-text font-medium">{endDate}</span>
        </p>
      )}
      {!endDate && <div className="mb-8" />}

      {/* Refresh button + auto-refresh logic */}
      <MaintenanceActions />
    </div>
  )
}
