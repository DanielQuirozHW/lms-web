import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavigationShell } from '@/components/shared/navigation/NavigationShell'
import { getAdminNav } from '@/lib/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = session.user.roles ?? []
  if (!roles.includes('ADMIN')) redirect('/dashboard')

  return <NavigationShell navGroups={getAdminNav()}>{children}</NavigationShell>
}
