import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | NexusLMS',
    default: 'NexusLMS — Plataforma de aprendizaje online',
  },
  description:
    'Plataforma de aprendizaje online con cursos en video, evaluaciones interactivas y certificados reconocidos.',
  openGraph: {
    type: 'website',
    siteName: 'NexusLMS',
    title: 'NexusLMS — Aprendizaje sin límites',
    description: 'Plataforma de aprendizaje online con cursos, evaluaciones y certificados.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
