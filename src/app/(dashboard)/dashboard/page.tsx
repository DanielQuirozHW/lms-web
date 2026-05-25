import type { Metadata } from 'next'
import { auth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()

  const firstName = session?.user?.firstName ?? session?.user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
      {/* Dashboard widgets will go here */}
    </div>
  )
}
