'use client'

import { useRouter } from 'next/navigation'
import { Bell, LogOut, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import api from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationsStore } from '@/store/notifications.store'

export function Header() {
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
      if (session?.refreshToken) {
        await api.post('/auth/logout', { refreshToken: session.refreshToken })
      }
    } catch {
      // Backend logout failed — proceed with signOut to clear the local session
    }
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-background sticky top-0 z-30 flex h-16 items-center justify-end gap-3 border-b px-6">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => router.push('/notifications')}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium focus-visible:outline-none">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block">{fullName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-foreground">
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
    </header>
  )
}
