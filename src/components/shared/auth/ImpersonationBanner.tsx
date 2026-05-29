'use client'

import { Loader2 } from 'lucide-react'
import { useStopImpersonationMutation } from '@/hooks/mutations/impersonation'

interface ImpersonationBannerProps {
  firstName: string
  lastName: string
  email: string
}

export function ImpersonationBanner({ firstName, lastName, email }: ImpersonationBannerProps) {
  const { mutate: stop, isPending } = useStopImpersonationMutation()

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-center gap-3 bg-amber-500 px-4 text-black"
    >
      <span className="truncate text-sm font-medium">
        👁 Estás viendo como {firstName} {lastName} ({email})
      </span>
      <span aria-hidden="true" className="hidden shrink-0 sm:inline">
        —
      </span>
      <button
        type="button"
        onClick={() => stop()}
        disabled={isPending}
        className="shrink-0 rounded bg-black/10 px-3 py-0.5 text-sm font-semibold transition-colors hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Restaurando...
          </span>
        ) : (
          'Volver a mi cuenta'
        )}
      </button>
    </div>
  )
}
