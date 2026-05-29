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
import { NavigationShell } from '@/components/shared/navigation/NavigationShell'
import type { NavGroup } from '@/components/shared/navigation/Sidebar'

const navGroups: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'APRENDIZAJE',
    items: [
      { label: 'Explorar cursos', href: '/courses', icon: BookOpen },
      { label: 'Mis cursos', href: '/my-courses', icon: BookMarked },
    ],
  },
  {
    label: 'COMUNIDAD',
    items: [{ label: 'Mensajes', href: '/messages', icon: MessageSquare, badge: 'messages' }],
  },
  {
    label: 'PERSONAL',
    items: [
      { label: 'Calendario', href: '/calendar', icon: Calendar },
      { label: 'Notificaciones', href: '/notifications', icon: Bell, badge: 'notifications' },
      { label: 'Perfil', href: '/profile', icon: User },
    ],
  },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return <NavigationShell navGroups={navGroups}>{children}</NavigationShell>
}
