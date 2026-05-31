'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

// ─── Logo ─────────────────────────────────────────────────────────────────────

function NexusLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex items-center gap-2.5 py-3.5 transition-all duration-200',
        collapsed ? 'justify-center px-0' : 'px-4'
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M14 1.5L25.5 8v14L14 28.5 2.5 22V8L14 1.5z"
          fill="currentColor"
          className="text-nexus-accent"
        />
        <path d="M14 7.5l8.5 4.9V18L14 23l-8.5-4.9v-5.6L14 7.5z" fill="white" fillOpacity="0.2" />
      </svg>
      {!collapsed && (
        <span className="text-nexus-text text-[15px] font-bold tracking-tight">
          Nexus<span className="text-nexus-accent">LMS</span>
        </span>
      )}
    </Link>
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
      <div className={cn('flex flex-col gap-1 py-2', collapsed ? 'px-2' : 'px-3')}>
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn('flex flex-col gap-0.5', gi > 0 && 'mt-4')}>
            {group.label && !collapsed && (
              <p className="text-nexus-faint px-3 pb-1 text-[10px] font-semibold tracking-widest uppercase select-none">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item, pathname)
              const count = badgeCount(item)

              const linkClassName = cn(
                'relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors duration-150',
                collapsed ? 'h-9 w-9 justify-center' : 'h-9 px-3',
                active
                  ? 'bg-nexus-accent-muted text-nexus-accent'
                  : 'text-nexus-muted hover:bg-nexus-card hover:text-nexus-text'
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    {/* TooltipTrigger is the styled hover target; Link fills it for navigation */}
                    <TooltipTrigger className={linkClassName}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className="absolute inset-0 flex items-center justify-center rounded-md"
                        tabIndex={-1}
                        aria-label={item.label}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                      {count > 0 && (
                        <span className="bg-nexus-accent pointer-events-none absolute top-0.5 right-0.5 h-2 w-2 rounded-full" />
                      )}
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
                  className={linkClassName}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count > 0 && (
                    <span className="bg-nexus-accent flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
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

// ─── User footer ──────────────────────────────────────────────────────────────

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession()
  const user = session?.user
  if (!user) return null

  const firstName = user.firstName ?? user.name?.split(' ')[0] ?? ''
  const lastName = user.lastName ?? user.name?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U'

  if (collapsed) {
    return (
      <TooltipProvider delay={400}>
        <div className="border-nexus-border flex justify-center border-t px-2 py-3">
          <Tooltip>
            <TooltipTrigger className="cursor-default">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
                <AvatarFallback className="bg-nexus-accent-muted text-nexus-accent text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">{fullName}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="border-nexus-border flex items-center gap-3 border-t px-4 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
        <AvatarFallback className="bg-nexus-accent-muted text-nexus-accent text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-nexus-text truncate text-sm font-medium">{fullName}</p>
        {user.email && <p className="text-nexus-faint truncate text-xs">{user.email}</p>}
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
                <span className="bg-nexus-accent absolute -top-1 -right-1 h-2 w-2 rounded-full" />
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
          isCollapsed ? 'w-13' : 'w-55'
        )}
      >
        <NexusLogo collapsed={isCollapsed} />

        <ScrollArea className="flex-1">
          <NavGroups {...sharedNavProps} collapsed={isCollapsed} />
        </ScrollArea>

        <UserFooter collapsed={isCollapsed} />

        {/* Collapse toggle */}
        <div className="border-nexus-border border-t">
          <button
            onClick={onToggle}
            className={cn(
              'text-nexus-faint hover:text-nexus-muted hover:bg-nexus-card flex w-full items-center py-3 text-xs font-medium transition-colors duration-150',
              isCollapsed ? 'justify-center' : 'gap-2 px-4'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                <span>Contraer</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile: Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-nexus-surface border-nexus-border w-55 p-0">
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
