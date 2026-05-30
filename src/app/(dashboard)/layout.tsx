import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavigationShell } from '@/components/shared/navigation/NavigationShell'
import { getDashboardNav } from '@/lib/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return <NavigationShell navGroups={getDashboardNav()}>{children}</NavigationShell>
}
