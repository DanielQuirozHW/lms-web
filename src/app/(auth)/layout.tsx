import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  // Only redirect when the session is valid — RefreshTokenExpired is treated as unauthenticated
  if (session && session.error !== 'RefreshTokenExpired') redirect('/dashboard')

  return <div className="bg-nexus-bg min-h-screen">{children}</div>
}
