import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      {/* Sidebar nav will go here */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
