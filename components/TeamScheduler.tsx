'use client'

import { useState } from 'react'
import { TeamMemberSelector } from './TeamMemberSelector'
import { EmailTeamBuilder } from './EmailTeamBuilder'
import { BookingCalendarView } from './BookingCalendarView'
import { TimeSlotSelector } from './TimeSlotSelector'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

interface TimeSlot {
  start: string
  end: string
}

interface BookingResult {
  success: boolean
  meeting: {
    id: string
    title: string
    startTime: string
    endTime: string
    participants: string[]
    meetingLink?: string
  }
}

export function TeamScheduler() {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [duration, setDuration] = useState(30)
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualEmails, setManualEmails] = useState<string[]>([])
  const [suggested, setSuggested] = useState<string[]>([])

  const handleBooking = async (slot: TimeSlot, title: string, description?: string) => {
    try {
      setBooking(true)
      setError(null)
      
      const response = await fetch('/api/book-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          startTime: slot.start,
          endTime: slot.end,
          duration,
          participants: selectedEmails
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to book meeting')
      }

      const result = await response.json()
      setBookingResult(result)
      
      // Clear form after successful booking
      setAvailableSlots([])
      setSelectedEmails([])
    } catch (error) {
      console.error('Error booking meeting:', error)
      setError(error instanceof Error ? error.message : 'Failed to book meeting')
    } finally {
      setBooking(false)
    }
  }

  const handleStartOver = () => {
    setBookingResult(null)
    setError(null)
    setAvailableSlots([])
    setSelectedEmails([])
  }

  if (bookingResult) {
    return (
      <div className="p-2">
        <div className="text-center space-y-4">
          <Icon name="CheckCircle" className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Meeting Booked Successfully!</h2>
          
          <div className="rounded-lg border p-6 text-left bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
            <h3 className="font-semibold mb-2">{bookingResult.meeting.title}</h3>
            <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
              <p><strong>When:</strong> {new Date(bookingResult.meeting.startTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> {duration} minutes</p>
              <p><strong>Participants:</strong> {bookingResult.meeting.participants.length + 1} people</p>
              {bookingResult.meeting.meetingLink && (
                <p><strong>Meeting Link:</strong> <a href={bookingResult.meeting.meetingLink} className="underline" target="_blank" rel="noopener noreferrer">Google Meet</a></p>
              )}
            </div>
          </div>

          <div className="text-sm text-[var(--muted-foreground)] space-y-1">
            <p>✅ Calendar invites sent to all participants</p>
            <p>✅ Google Calendar events created</p>
            <p>✅ Meeting notifications enabled</p>
          </div>

          <Button onClick={handleStartOver}>
            Schedule Another Meeting
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon name="Users" className="h-8 w-8 text-[var(--primary)]" />
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Team Scheduler</h1>
        </div>
        <p className="text-[var(--muted-foreground)]">Find and book team meetings with automatic calendar integration</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-6">
          <TeamMemberSelector
            selectedEmails={selectedEmails}
            onSelectionChange={setSelectedEmails}
          />
          <EmailTeamBuilder
            domain={process.env.NEXT_PUBLIC_COMPANY_DOMAIN as any}
            members={manualEmails}
            onAdd={(email) => setManualEmails((prev) => Array.from(new Set([...prev, email])))}
            onRemove={(email) => setManualEmails((prev) => prev.filter((e) => e !== email))}
          />

          {/* Duration Selector */}
          <div className="rounded-lg border p-4 bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Clock" className="h-5 w-5" />
              <h3 className="font-semibold">Meeting Duration</h3>
            </div>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          
          <BookingCalendarView
            selectedEmails={[...new Set([...selectedEmails, ...manualEmails])]}
            duration={duration}
            onSlotsFound={(slots) => {
              setAvailableSlots(slots)
              setError(null)
            }}
            onSuggestionsFound={(emails) => setSuggested(emails)}
          />
        </div>
        {suggested.length > 0 && (
          <div className="rounded-lg border p-4 bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
            <h4 className="font-semibold mb-2">Discovered colleagues in your calendars</h4>
            <div className="flex flex-wrap gap-2">
              {suggested.map((email) => (
                <span key={email} className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-[var(--muted)] text-[var(--foreground)]">
                  {email}
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      await fetch('/api/team-members/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
                      setManualEmails((prev) => Array.from(new Set([...prev, email])))
                      setSuggested((prev) => prev.filter((e) => e !== email))
                    } catch {}
                  }}>Add</Button>
                </span>
              ))}
            </div>
          </div>
        )}
        <div data-section="booking">
          {booking ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-[var(--muted-foreground)]">Booking meeting...</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Creating calendar events and sending invites</p>
              </div>
            </div>
          ) : (
            <TimeSlotSelector
              slots={availableSlots}
              duration={duration}
              participants={[...selectedEmails]}
              onBooking={handleBooking}
            />
          )}
        </div>
      </div>
    </div>
  )
}