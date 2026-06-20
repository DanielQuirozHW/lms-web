'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useNotificationsStore } from '@/store/notifications.store'
import { useMessagesStore } from '@/store/messages.store'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  badge?: 'notifications' | 'messages'
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

interface SidebarProps {
  navGroups: NavGroup[]
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  isCollapsed: boolean
  onToggle: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

// ─── Brand logo + collapse toggle ────────────────────────────────────────────

function NexusLogo({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  return (
    <div
      className={cn(
        'border-nexus-border flex shrink-0 items-center border-b transition-all duration-200',
        collapsed ? 'h-24 flex-col items-center justify-center gap-2 px-0' : 'h-16 gap-3 px-4'
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3',
          collapsed && 'flex-none justify-center'
        )}
        aria-label="NexusLMS home"
      >
        {/* Gradient brand icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{
            background: 'var(--nexus-brand-gradient)',
            boxShadow: 'var(--nexus-brand-shadow)',
          }}
          aria-hidden="true"
        >
          N
        </div>
        {!collapsed && (
          <span className="text-nexus-text truncate text-[15px] font-bold tracking-tight">
            Nexus<span className="text-nexus-accent">LMS</span>
          </span>
        )}
      </Link>

      {onToggle && (
        <button
          onClick={onToggle}
          className="text-nexus-faint hover:text-nexus-muted hover:bg-nexus-card shrink-0 rounded-lg p-1.5 transition-colors duration-150"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

// ─── Nav groups ───────────────────────────────────────────────────────────────

interface NavGroupsProps {
  navGroups: NavGroup[]
  pathname: string
  notificationsCount: number
  messagesCount: number
  collapsed: boolean
  onNavigate?: () => void
}

function NavGroups({
  navGroups,
  pathname,
  notificationsCount,
  messagesCount,
  collapsed,
  onNavigate,
}: NavGroupsProps) {
  function badgeCount(item: NavItem): number {
    if (item.badge === 'notifications') return notificationsCount
    if (item.badge === 'messages') return messagesCount
    return 0
  }

  return (
    <TooltipProvider delay={400}>
      <div className={cn('flex flex-col gap-1 py-4', collapsed ? 'px-4' : 'px-3')}>
        {navGroups.map((group, gi) => (
          <div
            key={gi}
            className={cn(
              'flex flex-col',
              collapsed ? 'gap-[5px]' : 'gap-0.5',
              gi > 0 && (collapsed ? 'mt-3' : 'mt-5')
            )}
          >
            {/* Section label — completely hidden when collapsed */}
            {group.label && !collapsed && (
              <p className="text-nexus-faint px-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase select-none">
                {group.label}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item, pathname)
              const count = badgeCount(item)

              const sharedClass = cn(
                'relative flex w-full items-center text-sm font-medium transition-all duration-200',
                collapsed ? 'rounded-[14px]' : 'rounded-xl',
                active
                  ? 'text-white'
                  : 'text-nexus-muted hover:bg-nexus-nav-hover hover:text-nexus-nav-hover-fg'
              )

              const activeStyle = active
                ? {
                    background: 'var(--nexus-nav-active-gradient)',
                    boxShadow: 'var(--nexus-nav-active-shadow)',
                  }
                : undefined

              if (collapsed) {
                // TooltipTrigger renders a <button>; Link is absolute-inset-0 so it covers
                // the full hit area without creating invalid <button><a> nesting issues.
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger
                      className={cn(sharedClass, 'h-[46px] justify-center rounded-[14px]')}
                      style={activeStyle}
                    >
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className="absolute inset-0 flex items-center justify-center rounded-[14px]"
                        tabIndex={-1}
                        aria-label={item.label}
                      >
                        {count > 0 ? (
                          <span className="relative">
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className="bg-nexus-danger pointer-events-none absolute -top-1 -right-1 h-2 w-2 rounded-full" />
                          </span>
                        ) : (
                          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(sharedClass, 'h-10 gap-2.5 px-3')}
                  style={activeStyle}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count > 0 && (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                      style={{ background: 'var(--nexus-nav-active-gradient)' }}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}

// ─── User footer card ─────────────────────────────────────────────────────────

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession()
  const user = session?.user
  if (!user) return null

  const firstName = user.firstName ?? user.name?.split(' ')[0] ?? ''
  const lastName = user.lastName ?? user.name?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U'

  const avatarEl = (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden text-xs font-bold text-white',
        collapsed ? 'h-10 w-10 rounded-[12px]' : 'h-8 w-8 rounded-lg'
      )}
      style={{ background: 'var(--nexus-brand-gradient)' }}
      aria-hidden="true"
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )

  if (collapsed) {
    return (
      <TooltipProvider delay={400}>
        <div className="border-nexus-border flex justify-center border-t px-0 py-4">
          <Tooltip>
            <TooltipTrigger className="cursor-default">{avatarEl}</TooltipTrigger>
            <TooltipContent side="right">{fullName}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="border-nexus-border border-t px-3 py-3">
      <div className="bg-nexus-usercard border-nexus-usercard-border flex items-center gap-3 rounded-xl border px-3 py-2.5">
        {avatarEl}
        <div className="min-w-0 flex-1">
          <p className="text-nexus-text truncate text-sm font-semibold">{fullName}</p>
          {user.email && <p className="text-nexus-user-email truncate text-xs">{user.email}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

interface MobileBottomNavProps {
  navGroups: NavGroup[]
  pathname: string
  notificationsCount: number
  messagesCount: number
  onMoreClick: () => void
}

function MobileBottomNav({
  navGroups,
  pathname,
  notificationsCount,
  messagesCount,
  onMoreClick,
}: MobileBottomNavProps) {
  const allItems = navGroups.flatMap((g) => g.items)
  const quickItems = allItems.slice(0, 4)
  const hasMore = allItems.length > 4

  function badgeCount(item: NavItem): number {
    if (item.badge === 'notifications') return notificationsCount
    if (item.badge === 'messages') return messagesCount
    return 0
  }

  return (
    <nav
      className="border-nexus-border bg-nexus-surface fixed right-0 bottom-0 left-0 z-40 flex h-16 items-stretch border-t lg:hidden"
      aria-label="Mobile navigation"
    >
      {quickItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item, pathname)
        const count = badgeCount(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150',
              active ? 'text-nexus-accent' : 'text-nexus-muted'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {count > 0 && (
                <span className="bg-nexus-danger absolute -top-1 -right-1 h-2 w-2 rounded-full" />
              )}
            </div>
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
      {hasMore && (
        <button
          onClick={onMoreClick}
          className="text-nexus-muted flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150"
          aria-label="More navigation options"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Más</span>
        </button>
      )}
    </nav>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  navGroups,
  mobileOpen,
  onMobileOpenChange,
  isCollapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname()
  const notificationsCount = useNotificationsStore((s) => s.unreadCount)
  const messagesCount = useMessagesStore((s) => s.messagesUnreadCount)

  const sharedNavProps = { navGroups, pathname, notificationsCount, messagesCount }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'border-nexus-border bg-nexus-surface sticky top-0 hidden h-screen flex-col overflow-x-hidden border-r transition-[width] duration-200 ease-in-out lg:flex',
          isCollapsed ? 'w-[78px]' : 'w-[268px]'
        )}
      >
        <NexusLogo collapsed={isCollapsed} onToggle={onToggle} />

        <ScrollArea className="flex-1">
          <NavGroups {...sharedNavProps} collapsed={isCollapsed} />
        </ScrollArea>

        <UserFooter collapsed={isCollapsed} />
      </aside>

      {/* Mobile: Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-nexus-surface border-nexus-border w-[268px] p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-full flex-col">
            <NexusLogo collapsed={false} />
            <ScrollArea className="flex-1">
              <NavGroups
                {...sharedNavProps}
                collapsed={false}
                onNavigate={() => onMobileOpenChange(false)}
              />
            </ScrollArea>
            <UserFooter collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile bottom navigation */}
      <MobileBottomNav {...sharedNavProps} onMoreClick={() => onMobileOpenChange(true)} />
    </>
  )
}
