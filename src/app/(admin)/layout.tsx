import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = (session.user as { roles?: string[] }).roles ?? []
  if (!roles.includes('ADMIN')) redirect('/dashboard')

  return <>{children}</>
}
