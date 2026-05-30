import { isApiError } from '@/lib/api'

/**
 * Returns the API error message when available, otherwise returns the fallback string.
 * Standardizes error message extraction across all mutation onError handlers.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    return error.response?.data?.message ?? fallback
  }
  return fallback
}
