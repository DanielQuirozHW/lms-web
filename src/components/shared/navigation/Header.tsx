'use client'

import { useRef, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Award, LogOut, Menu, Search, Settings, Sun, Moon, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { NotificationsBell } from '@/components/features/notifications/NotificationsBell'
import { HeaderSearch } from '@/components/shared/search/HeaderSearch'
import { cn } from '@/lib/utils'

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

const ICONBTN =
  'flex h-10.5 w-10.5 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border-none bg-nexus-iconbtn text-nexus-iconbtn-fg transition-colors duration-150 hover:bg-nexus-iconbtn-hover hover:text-nexus-iconbtn-hover-fg focus-visible:outline-none'

const AVATAR_MENU_ITEMS = [
  { icon: User, label: 'Perfil', href: '/profile' },
  { icon: Settings, label: 'Configuración', href: '/profile' },
  { icon: Award, label: 'Mis certificados', href: '/certificates' },
] as const

export function Header({ onMobileMenuOpen, onSearchOpen, className }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const user = session?.user
  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? ''
  const lastName = user?.lastName ?? user?.name?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U'
  const pageTitle = getPageTitle(pathname)

  // Close avatar menu on outside click
  useEffect(() => {
    if (!avatarOpen) return
    function onMouseDown(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [avatarOpen])

  async function handleLogout() {
    setAvatarOpen(false)
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
        'border-nexus-border bg-nexus-surface sticky top-0 z-30 flex h-18 items-center gap-3 border-b px-6',
        className
      )}
    >
      {/* Mobile: hamburger */}
      <button
        type="button"
        onClick={onMobileMenuOpen}
        className={cn(ICONBTN, 'lg:hidden')}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title (desktop) / centred logo (mobile) */}
      <div className="flex min-w-0 flex-1 items-center">
        {pageTitle && (
          <h2 className="text-nexus-text hidden text-[20px] font-extrabold tracking-[-0.02em] lg:block">
            {pageTitle}
          </h2>
        )}
        <div className="flex flex-1 justify-center lg:hidden">
          <span className="text-nexus-text text-sm font-bold tracking-tight">
            Nexus<span className="text-nexus-accent">LMS</span>
          </span>
        </div>
        <div className="hidden flex-1 lg:block" />
      </div>

      {/* Desktop inline search */}
      <HeaderSearch />

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Mobile search icon */}
        <button
          type="button"
          onClick={onSearchOpen}
          className={cn(ICONBTN, 'lg:hidden')}
          aria-label="Buscar cursos"
        >
          <Search className="h-[19px] w-[19px]" />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(ICONBTN, 'relative')}
          aria-label="Cambiar tema"
        >
          <Sun
            className="h-[19px] w-[19px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
            aria-hidden="true"
          />
          <Moon
            className="absolute h-[19px] w-[19px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
            aria-hidden="true"
          />
        </button>

        {/* Notification bell */}
        <NotificationsBell />

        {/* Avatar dropdown — plain div, no shadcn */}
        <div ref={avatarRef} className="relative">
          <button
            type="button"
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex h-10.5 w-10.5 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[13px] border-none text-[13px] font-bold text-white focus-visible:outline-none"
            style={{ background: 'var(--nexus-brand-gradient)' }}
            aria-label="Menú de usuario"
            aria-expanded={avatarOpen}
            aria-haspopup="menu"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>

          {avatarOpen && (
            <div
              className="bg-nexus-card border-nexus-border absolute top-[calc(100%+12px)] right-0 z-50 w-[268px] overflow-hidden rounded-[18px] border"
              style={{ boxShadow: 'var(--nexus-menu-shadow)' }}
              role="menu"
              aria-label="Menú de usuario"
            >
              {/* User header */}
              <div className="border-nexus-border flex items-center gap-3 border-b px-[18px] py-[18px]">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold text-white"
                  style={{ background: 'var(--nexus-brand-gradient)' }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-nexus-text truncate text-[14.5px] font-bold">{fullName}</p>
                  {user?.email && (
                    <p className="text-nexus-user-email mt-0.5 truncate text-[12.5px]">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                {AVATAR_MENU_ITEMS.map(({ icon: Icon, label, href }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAvatarOpen(false)
                      router.push(href)
                    }}
                    className="text-nexus-text hover:bg-nexus-menu-hover flex w-full items-center gap-3 rounded-[11px] px-[14px] py-[11px] text-left text-[14px] font-semibold transition-colors"
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Danger section */}
              <div className="border-nexus-border border-t p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="text-nexus-danger hover:bg-nexus-danger-bg flex w-full items-center gap-3 rounded-[11px] px-[14px] py-[11px] text-left text-[14px] font-semibold transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
