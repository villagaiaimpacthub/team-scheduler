'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
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

export function MeetingsCalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[MeetingsCalendarView] Fetching events from Google Calendar API...')
      
      // Get events for the next 3 months
      const now = new Date()
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
      
      const params = new URLSearchParams({
        start: now.toISOString(),
        end: endDate.toISOString(),
        debug: '1'
      })
      
      const response = await fetch(`/api/events?${params}`, {
        credentials: 'include',
        cache: 'no-store'
      })
      
      console.log('[MeetingsCalendarView] API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[MeetingsCalendarView] API error:', errorText)
        throw new Error(`Failed to fetch events: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('[MeetingsCalendarView] API response data:', data)
      
      // Convert events to meeting format
      const eventsData = data.events || []
      const meetingsData = eventsData.map((event: any) => ({
        id: event.id,
        title: event.title || 'Untitled Event',
        description: event.description || '',
        startTime: event.start,
        endTime: event.end,
        duration: Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60)),
        location: event.location || '',
        organizer: { name: 'You', email: 'you@example.com' },
        participants: [],
        googleEventId: event.id,
        createdAt: new Date().toISOString()
      }))
      
      console.log('[MeetingsCalendarView] Converted to meetings format:', meetingsData.length, 'meetings')
      
      setMeetings(meetingsData)
    } catch (error) {
      console.error('[MeetingsCalendarView] Error fetching meetings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  const meetingsByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const meeting of meetings) {
      const date = new Date(meeting.startTime)
      const key = date.toISOString().slice(0, 10)
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [meetings])

  const selectedDateMeetings = useMemo(() => {
    if (!selectedDate) return []
    const selectedKey = selectedDate.toISOString().slice(0, 10)
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime)
      const meetingKey = meetingDate.toISOString().slice(0, 10)
      return meetingKey === selectedKey
    })
  }, [selectedDate, meetings])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'h:mm a')
  }

  if (loading) {
    return <LoadingSpinner text="Loading calendar..." />
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          onDayClick={handleDateClick}
          meetingsByDay={meetingsByDay}
          captionLayout="dropdown"
        />
      </div>

      <Card className="border-0 shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="Calendar" className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">
              {selectedDate 
                ? `Meetings for ${format(selectedDate, 'EEEE, MMM d, yyyy')}`
                : 'Select a date to view meetings'
              }
            </h3>
          </div>

          {selectedDateMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Calendar" className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">
                {selectedDate ? 'No meetings scheduled for this day' : 'Select a date to see meetings'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{meeting.title}</h4>
                      
                      <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" className="h-4 w-4" />
                          <span>
                            {formatDateTime(meeting.startTime)} - {formatDateTime(meeting.endTime)}
                          </span>
                          <span className="text-xs">({meeting.duration} min)</span>
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

                      <div className="mt-3">
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
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}