import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Users, BookOpen, Tag } from 'lucide-react'
import { Sidebar } from '@/components/shared/navigation/Sidebar'
import { Header } from '@/components/shared/navigation/Header'
import type { NavItem } from '@/components/shared/navigation/Sidebar'

const navItems: NavItem[] = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = session.user.roles ?? []
  if (!roles.includes('ADMIN')) redirect('/dashboard')

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
