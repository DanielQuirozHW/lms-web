'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumbs } from './Breadcrumbs'
import { ImpersonationBanner } from '@/components/shared/auth/ImpersonationBanner'
import { GlobalAnnouncementBanner } from '@/components/shared/announcements/GlobalAnnouncementBanner'
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
  // Lazy initializer: reads localStorage at client mount; falls back to false on SSR.
  // No effect needed — avoids the extra render cycle from setState-in-effect.
  const [isCollapsed, setIsCollapsed] = useState(
    () =>
      typeof window !== 'undefined' && localStorage.getItem('nexus-sidebar-collapsed') === 'true'
  )
  const { data: session } = useSession()
  const isPrivileged =
    session?.user?.roles?.some((r) => r === 'ADMIN' || r === 'INSTRUCTOR') ?? false
  const navGroups = useNavGroups(isPrivileged)

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
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />
        <GlobalAnnouncementBanner />
        <Breadcrumbs />
        {/* pb-20 on mobile so content clears the fixed bottom nav */}
        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  )
}
