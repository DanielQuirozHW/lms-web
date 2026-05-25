import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          // Never retry on 401, 403, 404
          if (isApiError(error)) {
            const status = error.response?.data.statusCode ?? 0
            if (status === 401 || status === 403 || status === 404) return false
          }
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new instance
    return makeQueryClient()
  }
  // Browser: reuse the same instance
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
