'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function MaintenanceActions() {
  const router = useRouter()

  // Auto-refresh every 60 seconds to check if maintenance has ended
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(id)
  }, [router])

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
    >
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      Verificar estado
    </button>
  )
}
