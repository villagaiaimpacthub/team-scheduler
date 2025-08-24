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
    <nav className="bg-[var(--background)] text-[var(--foreground)] border-b border-[color:var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Icon name="Users" className="h-6 w-6 text-[var(--primary)]" />
              <span className="text-xl font-bold text-[var(--foreground)]">Team Scheduler</span>
            </Link>
            
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-2 rounded-md text-sm font-medium"
              >
                Schedule
              </Link>
              <Link
                href="/meetings"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
              >
                <Icon name="Calendar" className="h-4 w-4" />
                My Meetings
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--muted-foreground)]">
              {user.user_metadata?.full_name || user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
            >
              <Icon name="LogOut" className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}