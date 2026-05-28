'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNotificationsStore } from '@/store/notifications.store'

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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function NexusLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-4">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 1.5L25.5 8v14L14 28.5 2.5 22V8L14 1.5z"
          fill="currentColor"
          className="text-nexus-accent"
        />
        <path d="M14 7.5l8.5 4.9V18L14 23l-8.5-4.9v-5.6L14 7.5z" fill="white" fillOpacity="0.18" />
      </svg>
      <span className="text-nexus-text text-base font-bold tracking-tight">
        Nexus<span className="text-nexus-accent">LMS</span>
      </span>
    </Link>
  )
}

// ─── Nav group renderer ───────────────────────────────────────────────────────

interface NavGroupsProps {
  navGroups: NavGroup[]
  pathname: string
  notificationsCount: number
  messagesCount: number
  onNavigate?: () => void
}

function NavGroups({
  navGroups,
  pathname,
  notificationsCount,
  messagesCount,
  onNavigate,
}: NavGroupsProps) {
  function badgeCount(item: NavItem): number {
    if (item.badge === 'notifications') return notificationsCount
    if (item.badge === 'messages') return messagesCount
    return 0
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {navGroups.map((group, gi) => (
        <div key={gi} className={cn('flex flex-col gap-0.5', gi > 0 && 'mt-3')}>
          {group.label && (
            <p className="text-nexus-muted/70 px-3 pb-1 text-[10px] font-semibold tracking-widest uppercase select-none">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            const active = isActive(item, pathname)
            const count = badgeCount(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-nexus-accent-muted text-nexus-accent'
                    : 'text-nexus-muted hover:bg-nexus-card hover:text-nexus-text'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
                {count > 0 && (
                  <span className="bg-nexus-accent flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── User footer ──────────────────────────────────────────────────────────────

function UserFooter() {
  const { data: session } = useSession()
  const user = session?.user
  if (!user) return null

  const firstName = user.firstName ?? user.name?.split(' ')[0] ?? ''
  const lastName = user.lastName ?? user.name?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U'

  return (
    <div className="border-nexus-border flex items-center gap-3 border-t px-4 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
        <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-nexus-text truncate text-sm font-medium">{fullName}</p>
        {user.email && <p className="text-nexus-muted truncate text-xs">{user.email}</p>}
      </div>
    </div>
  )
}

// ─── Mobile bottom navigation ─────────────────────────────────────────────────

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
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
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
          className="text-nexus-muted flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors"
          aria-label="More navigation options"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          <span>Más</span>
        </button>
      )}
    </nav>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ navGroups, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname()
  const notificationsCount = useNotificationsStore((s) => s.unreadCount)
  const messagesCount = useNotificationsStore((s) => s.messagesUnreadCount)

  const sharedNavProps = { navGroups, pathname, notificationsCount, messagesCount }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="border-nexus-border bg-nexus-surface sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r lg:flex">
        <NexusLogo />
        <ScrollArea className="flex-1">
          <NavGroups {...sharedNavProps} />
        </ScrollArea>
        <UserFooter />
      </aside>

      {/* Mobile: full-nav Sheet (opened by Header hamburger or bottom nav "Más") */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-nexus-surface border-nexus-border w-[240px] p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-full flex-col">
            <NexusLogo />
            <ScrollArea className="flex-1">
              <NavGroups {...sharedNavProps} onNavigate={() => onMobileOpenChange(false)} />
            </ScrollArea>
            <UserFooter />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile bottom navigation */}
      <MobileBottomNav {...sharedNavProps} onMoreClick={() => onMobileOpenChange(true)} />
    </>
  )
}
