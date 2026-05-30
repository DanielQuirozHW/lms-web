import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Bookmark,
  GraduationCap,
  MessageSquare,
  Calendar,
  Bell,
  User,
  PlusCircle,
  Users,
  Tag,
  Megaphone,
  Settings,
} from 'lucide-react'
import type { NavGroup } from '@/components/shared/navigation/Sidebar'

export function getDashboardNav(): NavGroup[] {
  return [
    {
      items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true }],
    },
    {
      label: 'APRENDIZAJE',
      items: [
        { label: 'Explorar cursos', href: '/courses', icon: BookOpen },
        { label: 'Mis cursos', href: '/my-courses', icon: BookMarked },
        { label: 'Guardados', href: '/bookmarks', icon: Bookmark },
        { label: 'Certificados', href: '/certificates', icon: GraduationCap },
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
}

export function getInstructorNav(): NavGroup[] {
  return [
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
      label: 'COMUNIDAD',
      items: [
        { label: 'Notificaciones', href: '/notifications', icon: Bell, badge: 'notifications' },
      ],
    },
  ]
}

export function getAdminNav(): NavGroup[] {
  return [
    {
      items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true }],
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
}
