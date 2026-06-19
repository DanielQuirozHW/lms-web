'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, Search, User, Sun, Moon } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationsStore } from '@/store/notifications.store'
import { cn } from '@/lib/utils'

// Maps exact and prefix paths to human-readable titles
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/courses': 'Explorar Cursos',
  '/my-courses': 'Mis Cursos',
  '/bookmarks': 'Guardados',
  '/certificates': 'Certificados',
  '/messages': 'Mensajes',
  '/calendar': 'Calendario',
  '/notifications': 'Notificaciones',
  '/profile': 'Perfil',
  '/instructor': 'Dashboard Instructor',
  '/instructor/courses': 'Mis Cursos',
  '/instructor/courses/new': 'Nuevo Curso',
  '/admin': 'Dashboard Admin',
  '/admin/users': 'Usuarios',
  '/admin/courses': 'Cursos',
  '/admin/categories': 'Categorías',
  '/admin/announcements': 'Anuncios',
  '/admin/settings': 'Configuración',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Dynamic routes: try stripping the last segment
  const parent = pathname.split('/').slice(0, -1).join('/')
  if (parent && PAGE_TITLES[parent]) return PAGE_TITLES[parent]
  return ''
}

interface HeaderProps {
  onMobileMenuOpen: () => void
  onSearchOpen: () => void
  className?: string
}

export function Header({ onMobileMenuOpen, onSearchOpen, className }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const { theme, setTheme } = useTheme()

  const user = session?.user
  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? ''
  const lastName = user?.lastName ?? user?.name?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U'
  const pageTitle = getPageTitle(pathname)

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Backend revocation failed — proceed with signOut to clear the local session
    }
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header
      className={cn(
        'border-nexus-border bg-nexus-surface/95 sticky top-0 z-30 flex h-13 items-center gap-3 border-b px-4 backdrop-blur-sm',
        className
      )}
    >
      {/* Mobile: hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card h-8 w-8 shrink-0 lg:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop: page title / Mobile: centred logo */}
      <div className="flex flex-1 items-center">
        {pageTitle && (
          <span className="text-nexus-text hidden text-sm font-semibold lg:block">{pageTitle}</span>
        )}
        <div className="flex flex-1 justify-center lg:hidden">
          <span className="text-nexus-text text-sm font-bold tracking-tight">
            Nexus<span className="text-nexus-accent">LMS</span>
          </span>
        </div>
        <div className="hidden flex-1 lg:block" />
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        {/* Global search */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card h-8 w-8"
          aria-label="Buscar cursos (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme toggle — CSS icon-swap avoids hydration mismatch */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card relative h-8 w-8"
          aria-label="Cambiar tema"
        >
          <Sun
            className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
            aria-hidden="true"
          />
          <Moon
            className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
            aria-hidden="true"
          />
        </Button>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card relative h-8 w-8"
          onClick={() => router.push('/notifications')}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="bg-nexus-accent absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" />
          )}
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:bg-nexus-card ml-1 flex cursor-pointer items-center rounded-lg p-1 transition-colors duration-150 focus-visible:outline-none"
            aria-label="User menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={fullName} />
              <AvatarFallback className="bg-nexus-accent-muted text-nexus-accent text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm leading-none font-medium">{fullName}</p>
                {user?.email && (
                  <p className="text-muted-foreground mt-1 truncate text-xs">{user.email}</p>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
