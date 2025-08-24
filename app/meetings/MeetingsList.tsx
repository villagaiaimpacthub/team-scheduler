'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Icon } from '@/components/ui/Icon'
import { format } from 'date-fns'

interface Meeting {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  location?: string
  organizer: {
    name: string
    email: string
  }
  participants: string[]
  googleEventId?: string
  createdAt: string
}

export function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meetings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }
      
      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'EEE, MMM d, yyyy • h:mm a')
  }

  if (loading) {
    return <LoadingSpinner text="Loading meetings..." />
  }

  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600 p-4">
          <p>Error: {error}</p>
        </div>
      </Card>
    )
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <div className="text-center p-8">
          <Icon name="Calendar" className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No meetings scheduled</h3>
          <p className="text-[var(--muted-foreground)]">Schedule your first team meeting to see it here.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} padding="none">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {meeting.title}
                </h3>
                
                <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-2">
                    <Icon name="Calendar" className="h-4 w-4" />
                    <span>{formatDateTime(meeting.startTime)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" className="h-4 w-4" />
                    <span>{meeting.duration} minutes</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Icon name="Users" className="h-4 w-4" />
                    <span>{meeting.participants.length + 1} participants</span>
                  </div>
                  
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <Icon name="Video" className="h-4 w-4" />
                      <a
                        href={meeting.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary)] underline flex items-center gap-1"
                      >
                        Google Meet
                        <Icon name="ExternalLink" className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {meeting.description && (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    {meeting.description}
                  </p>
                )}

                <div className="mt-4">
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">Participants:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--foreground)]">
                      {meeting.organizer.name || meeting.organizer.email} (organizer)
                    </span>
                    {meeting.participants.map((email, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--foreground)]"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}