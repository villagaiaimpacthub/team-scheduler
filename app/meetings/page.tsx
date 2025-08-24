'use client'

import { MeetingsList } from './MeetingsList'
import { GoogleCalendarView } from '@/components/GoogleCalendarView'
import { useAuth } from '../providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MeetingsPage() {
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
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Meetings</h1>
        <p className="text-[var(--muted-foreground)]">View and manage your scheduled team meetings</p>
      </div>
      
      <div className="mb-6">
        <GoogleCalendarView />
      </div>
      <MeetingsList />
    </div>
  )
}