import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  GraduationCap,
  MessageCircle,
  Bell,
} from 'lucide-react'
import { NavigationShell } from '@/components/shared/navigation/NavigationShell'
import type { NavGroup } from '@/components/shared/navigation/Sidebar'

const navGroups: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/instructor', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'CURSOS',
    items: [
      { label: 'Todos mis cursos', href: '/instructor/courses', icon: BookOpen },
      { label: 'Crear curso', href: '/instructor/courses/new', icon: PlusCircle, exact: true },
    ],
  },
  {
    label: 'GESTIÓN',
    items: [
      { label: 'Estudiantes', href: '/instructor/students', icon: Users },
      { label: 'Calificaciones', href: '/instructor/grades', icon: GraduationCap },
    ],
  },
  {
    label: 'COMUNIDAD',
    items: [
      { label: 'Foro', href: '/forum', icon: MessageCircle },
      { label: 'Notificaciones', href: '/notifications', icon: Bell, badge: 'notifications' },
    ],
  },
]

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const roles = session.user.roles ?? []
  const hasAccess = roles.includes('INSTRUCTOR') || roles.includes('ADMIN')
  if (!hasAccess) redirect('/dashboard')

  return <NavigationShell navGroups={navGroups}>{children}</NavigationShell>
}
