'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

interface NavLinksProps {
  navItems: NavItem[]
  pathname: string
  onNavigate?: () => void
}

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

function NavLinks({ navItems, pathname, onNavigate }: NavLinksProps) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item, pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

interface SidebarProps {
  navItems: NavItem[]
  brand?: string
  className?: string
}

export function Sidebar({ navItems, brand = 'LMS', className }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn('bg-card hidden w-64 shrink-0 flex-col border-r lg:flex', className)}>
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            {brand}
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <NavLinks navItems={navItems} pathname={pathname} />
        </ScrollArea>
        <Separator />
        <div className="text-muted-foreground p-3 text-xs">
          <p className="px-3 py-2">© 2025 LMS</p>
        </div>
      </aside>

      {/* Mobile: hamburger trigger (positioned within the header area) */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Mobile: Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-16 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="text-lg font-bold tracking-tight"
              onClick={() => setMobileOpen(false)}
            >
              {brand}
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <NavLinks
              navItems={navItems}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
