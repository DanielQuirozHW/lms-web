'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Provider ID registered by MicrosoftEntraID() in NextAuth v5
const MICROSOFT_PROVIDER_ID = 'microsoft-entra-id'

interface OAuthButtonsProps {
  /** Pre-validated redirect path. Defaults to '/dashboard'. */
  redirectTo?: string
}

// ─── Brand icons ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
        fill="#EA4335"
      />
      <path
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"
        fill="#4285F4"
      />
      <path
        d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
        fill="#FBBC05"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
        fill="#34A853"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OAuthButtons({ redirectTo = '/dashboard' }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<'google' | 'microsoft' | null>(null)
  const isAnyLoading = loading !== null

  const btnClass = cn(
    'border-nexus-border bg-nexus-card text-nexus-text hover:bg-nexus-bg',
    'flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-2.5',
    'text-sm font-medium transition-colors',
    isAnyLoading && 'cursor-not-allowed opacity-70'
  )

  async function handleGoogle() {
    setLoading('google')
    // signIn triggers a browser redirect — loading state stays until page unloads
    await signIn('google', { callbackUrl: redirectTo })
  }

  async function handleMicrosoft() {
    setLoading('microsoft')
    await signIn(MICROSOFT_PROVIDER_ID, { callbackUrl: redirectTo })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={isAnyLoading}
        className={btnClass}
        aria-label="Continuar con Google"
      >
        {loading === 'google' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Continuar con Google
      </button>

      <button
        type="button"
        onClick={handleMicrosoft}
        disabled={isAnyLoading}
        className={btnClass}
        aria-label="Continuar con Microsoft"
      >
        {loading === 'microsoft' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <MicrosoftIcon />
        )}
        Continuar con Microsoft
      </button>
    </div>
  )
}
