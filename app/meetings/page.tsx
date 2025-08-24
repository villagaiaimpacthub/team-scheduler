'use client'

import { MeetingsList } from './MeetingsList'
import { GoogleCalendarView } from '@/components/GoogleCalendarView'
import { useAuth } from '../providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

export default function MeetingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; start: string; end: string; allDay?: boolean } | null>(null)
  
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
        <GoogleCalendarView onEventSelect={setSelectedEvent} />
      </div>
      {selectedEvent ? (
        <Card>
          <div className="p-4 space-y-1">
            <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {new Date(selectedEvent.start).toLocaleString()} — {selectedEvent.end ? new Date(selectedEvent.end).toLocaleString() : ''}
              {selectedEvent.allDay ? ' (All day)' : ''}
            </p>
          </div>
        </Card>
      ) : (
        <MeetingsList />
      )}
    </div>
  )
}