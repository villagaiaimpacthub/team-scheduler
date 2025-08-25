'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TeamMemberSelector } from '@/components/TeamMemberSelector'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const handleProceedToFindTimes = () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one team member')
      return
    }

    // Store selected emails in sessionStorage to pass between pages
    sessionStorage.setItem('selectedEmails', JSON.stringify(selectedEmails))
    router.push('/book/find-times')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="space-y-6 w-full max-w-4xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Users" className="h-8 w-8 text-[var(--primary)]" />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Team Scheduler</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">Find and book team meetings with automatic calendar integration</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Select Team Members</h2>
            <p className="text-[var(--muted-foreground)] text-sm">Choose who you'd like to meet with</p>
          </div>

          <div className="rounded-lg shadow-md border p-6 bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
            <TeamMemberSelector
              selectedEmails={selectedEmails}
              onSelectionChange={setSelectedEmails}
            />
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleProceedToFindTimes}
              disabled={selectedEmails.length === 0}
              size="lg"
              className="min-w-[200px]"
            >
              <Icon name="ArrowRight" className="mr-2 h-5 w-5" />
              Find Times ({selectedEmails.length + 1} people)
            </Button>
          </div>

          <div className="text-center text-xs text-[var(--muted-foreground)] space-y-1">
            <p>• Meeting duration: 1 hour (default)</p>
            <p>• Business hours only (9 AM - 5 PM, weekdays)</p>
            <p>• Requires Google Calendar access for all participants</p>
          </div>
        </div>
      </div>
    </div>
  )
}