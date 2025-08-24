'use client'

import { TeamScheduler } from '@/components/TeamScheduler'
import { useAuth } from './providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="space-y-6">
        <div className="rounded-lg shadow-md border p-6 bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
          <TeamScheduler />
        </div>
        <div className="rounded-lg shadow-md border p-6 bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
          {/* Availability card remains full width */}
        </div>
      </div>
    </div>
  )
}