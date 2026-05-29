'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { getQueryClient } from '@/lib/query-client'
import { AuthErrorHandler } from '@/components/shared/auth/AuthErrorHandler'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <SessionProvider>
        <AuthErrorHandler />
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
