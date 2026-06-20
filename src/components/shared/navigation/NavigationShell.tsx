'use client'

import { useState, useEffect, startTransition } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumbs } from './Breadcrumbs'
import { ImpersonationBanner } from '@/components/shared/auth/ImpersonationBanner'
import { GlobalAnnouncementBanner } from '@/components/shared/announcements/GlobalAnnouncementBanner'
import { SessionTimeoutModal } from '@/components/shared/session/SessionTimeoutModal'
import { GlobalSearch } from '@/components/shared/search/GlobalSearch'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { useLogoutMutation } from '@/hooks/mutations/auth'
import { getDashboardNav, getInstructorNav, getAdminNav } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface NavigationShellProps {
  children: React.ReactNode
}

function useNavGroups(isPrivileged: boolean) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return getAdminNav()
  if (pathname.startsWith('/instructor')) return getInstructorNav()
  return getDashboardNav(isPrivileged)
}

export function NavigationShell({ children }: NavigationShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Always start expanded to match SSR; read localStorage after hydration to avoid mismatch.
  const [isCollapsed, setIsCollapsed] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('nexus-sidebar-collapsed') === 'true')
      startTransition(() => setIsCollapsed(true))
  }, [])
  const { data: session } = useSession()
  const isPrivileged =
    session?.user?.roles?.some((r) => r === 'ADMIN' || r === 'INSTRUCTOR') ?? false
  const navGroups = useNavGroups(isPrivileged)

  const { mutate: logout } = useLogoutMutation()
  // RefreshTokenExpired is treated as unauthenticated — don't track inactivity (MISTAKES [002])
  const sessionActive = !!session && session.error !== 'RefreshTokenExpired'
  const { showWarning, minutesRemaining, keepAlive } = useSessionTimeout({
    enabled: sessionActive,
    onTimeout: () => logout(),
  })

  function toggleCollapsed() {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('nexus-sidebar-collapsed', String(next))
  }

  const isImpersonating = !!session?.impersonatedBy

  return (
    <div className={cn('bg-nexus-bg flex min-h-screen', isImpersonating && 'pt-11')}>
      {isImpersonating && session && (
        <ImpersonationBanner
          firstName={session.user.firstName}
          lastName={session.user.lastName}
          email={session.user.email}
        />
      )}
      <Sidebar
        navGroups={navGroups}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
      />
      {/* Content area transitions alongside sidebar width */}
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-200">
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <GlobalAnnouncementBanner />
        <Breadcrumbs />
        {/* pb-20 on mobile so content clears the fixed bottom nav */}
        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {showWarning && (
        <SessionTimeoutModal
          minutesRemaining={minutesRemaining}
          onKeepAlive={keepAlive}
          onSignOut={() => logout()}
        />
      )}
    </div>
  )
}
