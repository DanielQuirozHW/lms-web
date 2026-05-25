import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = (session.user as { roles?: string[] }).roles ?? []
  const hasAccess = roles.includes('INSTRUCTOR') || roles.includes('ADMIN')
  if (!hasAccess) redirect('/dashboard')

  return <>{children}</>
}
