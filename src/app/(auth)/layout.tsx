import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session) redirect('/dashboard')

  return <div className="bg-muted/40 flex min-h-screen items-center justify-center">{children}</div>
}
