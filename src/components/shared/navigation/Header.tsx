'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Award, Bell, LogOut, Menu, Search, Settings, Sun, Moon, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
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
        'border-nexus-border bg-nexus-surface/95 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm',
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
      <div className="flex min-w-0 flex-1 items-center">
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

      {/* Inline search box (desktop) */}
      <button
        type="button"
        onClick={onSearchOpen}
        className="bg-nexus-search-bg text-nexus-muted hover:text-nexus-text hidden h-9 w-[280px] shrink-0 cursor-text items-center gap-2.5 rounded-[13px] px-3 text-sm transition-colors duration-150 lg:flex"
        aria-label="Buscar cursos (Ctrl+K)"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="border-nexus-border flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[11px]">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card h-8 w-8 lg:hidden"
          aria-label="Buscar cursos"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
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
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="bg-nexus-danger absolute top-1.5 right-1.5 h-2 w-2 rounded-full" />
          )}
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:bg-nexus-card ml-1 flex cursor-pointer items-center rounded-lg p-1 transition-colors duration-150 focus-visible:outline-none"
            aria-label="User menu"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
              style={{ background: 'var(--nexus-brand-gradient)' }}
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
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
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <Settings className="h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/certificates')}>
              <Award className="h-4 w-4" />
              Mis certificados
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
