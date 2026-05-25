import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LayoutDashboard, BookOpen, PlusCircle } from 'lucide-react'
import { Sidebar } from '@/components/shared/navigation/Sidebar'
import { Header } from '@/components/shared/navigation/Header'
import type { NavItem } from '@/components/shared/navigation/Sidebar'

const navItems: NavItem[] = [
  { label: 'Overview', href: '/instructor', icon: LayoutDashboard, exact: true },
  { label: 'My Courses', href: '/instructor/courses', icon: BookOpen },
  { label: 'Create Course', href: '/instructor/courses/new', icon: PlusCircle, exact: true },
]

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = session.user.roles ?? []
  const hasAccess = roles.includes('INSTRUCTOR') || roles.includes('ADMIN')
  if (!hasAccess) redirect('/dashboard')

  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
