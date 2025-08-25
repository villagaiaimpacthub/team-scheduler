'use client'

import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

export function Navigation() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  return (
    <nav className="bg-[var(--background)] text-[var(--foreground)] border-b border-[color:var(--border)] overflow-x-hidden">
      <div className="max-w-full sm:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16 w-full">
          <div className="flex items-center min-w-0">
            <Link href="/" className="hidden sm:flex items-center gap-2 shrink-0">
              <Icon name="Users" className="h-6 w-6 text-[var(--primary)]" />
              <span className="text-xl font-bold text-[var(--foreground)]">Team Scheduler</span>
            </Link>

            <div className="ml-2 sm:ml-6 flex items-center gap-2 sm:gap-4">
              <Link
                href="/schedule"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 sm:px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
              >
                <Icon name="Clock" className="h-4 w-4" />
                <span>Schedule</span>
              </Link>
              <Link
                href="/meetings"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 sm:px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
              >
                <Icon name="Calendar" className="h-4 w-4" />
                <span>My Meetings</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="text-sm text-[var(--muted-foreground)] truncate max-w-[8rem] sm:max-w-none">
              {user.user_metadata?.full_name || user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
            >
              <Icon name="LogOut" className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}