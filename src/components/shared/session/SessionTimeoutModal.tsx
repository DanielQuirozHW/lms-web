'use client'

import { Clock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SessionTimeoutModalProps {
  minutesRemaining: number
  onKeepAlive: () => void
  onSignOut: () => void
}

export function SessionTimeoutModal({
  minutesRemaining,
  onKeepAlive,
  onSignOut,
}: SessionTimeoutModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
    >
      <div className="border-nexus-border bg-nexus-card w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
        {/* Icon + title */}
        <div className="mb-4 flex items-start gap-3">
          <div className="bg-nexus-accent/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Clock className="text-nexus-accent h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="session-timeout-title" className="text-nexus-text text-base font-semibold">
              ¿Seguís ahí?
            </h2>
            <p id="session-timeout-desc" className="text-nexus-muted mt-1 text-sm">
              Tu sesión expirará en{' '}
              <span className="text-nexus-text font-medium">
                {minutesRemaining} {minutesRemaining === 1 ? 'minuto' : 'minutos'}
              </span>{' '}
              por inactividad.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSignOut}
            className="border-nexus-border text-nexus-muted hover:text-nexus-text gap-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </Button>
          <Button
            type="button"
            onClick={onKeepAlive}
            className="bg-nexus-accent hover:bg-nexus-accent-hover font-semibold text-white"
          >
            Continuar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
