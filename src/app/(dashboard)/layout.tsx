import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  MessageSquare,
  Calendar,
  Bell,
  User,
} from 'lucide-react'
import { Sidebar } from '@/components/shared/navigation/Sidebar'
import { Header } from '@/components/shared/navigation/Header'
import type { NavItem } from '@/components/shared/navigation/Sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Courses', href: '/courses', icon: BookOpen },
  { label: 'My Courses', href: '/my-courses', icon: BookMarked },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

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
