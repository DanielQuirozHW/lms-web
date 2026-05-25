'use client'

import { ErrorMessage } from '@/components/shared/feedback/ErrorMessage'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorMessage message={error.message} onRetry={reset} />
}
