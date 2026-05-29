import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, Tag, Megaphone, Settings } from 'lucide-react'
import { NavigationShell } from '@/components/shared/navigation/NavigationShell'
import type { NavGroup } from '@/components/shared/navigation/Sidebar'

const navGroups: NavGroup[] = [
  {
    items: [{ label: 'Panel', href: '/admin/users', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'USUARIOS',
    items: [{ label: 'Todos los usuarios', href: '/admin/users', icon: Users }],
  },
  {
    label: 'PLATAFORMA',
    items: [
      { label: 'Cursos', href: '/admin/courses', icon: BookOpen },
      { label: 'Categorías', href: '/admin/categories', icon: Tag },
      { label: 'Alertas globales', href: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'SISTEMA',
    items: [{ label: 'Configuración', href: '/admin/settings', icon: Settings }],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = session.user.roles ?? []
  if (!roles.includes('ADMIN')) redirect('/dashboard')

  return <NavigationShell navGroups={navGroups}>{children}</NavigationShell>
}
