'use client'

import { useState } from 'react'
import { Sidebar, type NavGroup } from './Sidebar'
import { Header } from './Header'
import { Breadcrumbs } from './Breadcrumbs'

interface NavigationShellProps {
  navGroups: NavGroup[]
  children: React.ReactNode
}

/**
 * Client wrapper that owns the mobile sidebar open/close state and composes
 * Sidebar + Header + main content. Layouts (Server Components) render this
 * and pass their navGroups; page content flows through `children`.
 */
export function NavigationShell({ navGroups, children }: NavigationShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="bg-nexus-bg flex min-h-screen">
      <Sidebar navGroups={navGroups} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      {/* Content column: no left offset needed — sidebar is a flex item on desktop */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />
        <Breadcrumbs />
        {/* pb-16 on mobile so content clears the fixed bottom nav */}
        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  )
}
