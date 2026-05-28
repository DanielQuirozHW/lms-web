'use client'

import { useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationsStore } from '@/store/notifications.store'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMobileMenuOpen: () => void
  className?: string
}

export function Header({ onMobileMenuOpen, className }: HeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const unreadCount = useNotificationsStore((s) => s.unreadCount)

  const user = session?.user
  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? ''
  const lastName = user?.lastName ?? user?.name?.split(' ').slice(1).join(' ') ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U'

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
        'border-nexus-border bg-nexus-surface/95 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur-sm',
        className
      )}
    >
      {/* Mobile: hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card shrink-0 lg:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile: centered logo */}
      <div className="flex flex-1 justify-center lg:hidden">
        <span className="text-nexus-text text-sm font-bold tracking-tight">
          Nexus<span className="text-nexus-accent">LMS</span>
        </span>
      </div>

      {/* Desktop: spacer pushes actions to the right */}
      <div className="hidden flex-1 lg:block" />

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="text-nexus-muted hover:text-nexus-text hover:bg-nexus-card relative"
          onClick={() => router.push('/notifications')}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="bg-nexus-accent absolute top-1.5 right-1.5 h-2 w-2 rounded-full" />
          )}
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:bg-nexus-card flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none"
            aria-label="User menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={fullName} />
              <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-nexus-text hidden sm:inline-block">{fullName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="text-sm leading-none font-medium">{fullName}</p>
              {user?.email && (
                <p className="text-muted-foreground mt-1 truncate text-xs">{user.email}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
