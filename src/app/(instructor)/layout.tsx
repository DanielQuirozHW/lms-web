import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavigationShell } from '@/components/shared/navigation/NavigationShell'
import { getInstructorNav } from '@/lib/navigation'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = session.user.roles ?? []
  const hasAccess = roles.includes('INSTRUCTOR') || roles.includes('ADMIN')
  if (!hasAccess) redirect('/dashboard')

  return <NavigationShell navGroups={getInstructorNav()}>{children}</NavigationShell>
}
