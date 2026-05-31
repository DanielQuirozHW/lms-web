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

// Resolves the correct nav based on the active route group.
// Called inside the Client Component so the icon functions (LucideIcon) never
// cross the Server → Client serialization boundary.
function useNavGroups() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return getAdminNav()
  if (pathname.startsWith('/instructor')) return getInstructorNav()
  return getDashboardNav()
}

/**
 * Client wrapper that owns the mobile sidebar open/close state and composes
 * Sidebar + Header + main content. Layouts (Server Components) render this;
 * page content flows through `children`. Nav groups are resolved here — not
 * passed as props — so LucideIcon functions stay client-side only.
 */
export function NavigationShell({ children }: NavigationShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const navGroups = useNavGroups()

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
      <Sidebar navGroups={navGroups} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      {/* Content column: no left offset needed — sidebar is a flex item on desktop */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />
        <GlobalAnnouncementBanner />
        <Breadcrumbs />
        {/* pb-16 on mobile so content clears the fixed bottom nav */}
        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  )
}
