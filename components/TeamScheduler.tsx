'use client'

import { useState } from 'react'
import { TeamMemberSelector } from './TeamMemberSelector'
import { AvailabilityChecker } from './AvailabilityChecker'
import { TimeSlotSelector } from './TimeSlotSelector'
import { Button } from './ui/Button'
import { Users, CheckCircle } from 'lucide-react'

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
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-green-700">Meeting Booked Successfully!</h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-green-800 mb-2">{bookingResult.meeting.title}</h3>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>When:</strong> {new Date(bookingResult.meeting.startTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> {duration} minutes</p>
              <p><strong>Participants:</strong> {bookingResult.meeting.participants.length + 1} people</p>
              {bookingResult.meeting.meetingLink && (
                <p><strong>Meeting Link:</strong> <a href={bookingResult.meeting.meetingLink} className="underline" target="_blank" rel="noopener noreferrer">Google Meet</a></p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold">Team Scheduler</h1>
        </div>
        <p className="text-gray-600">Find and book team meetings with automatic calendar integration</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TeamMemberSelector
            selectedEmails={selectedEmails}
            onSelectionChange={setSelectedEmails}
          />
          
          <AvailabilityChecker
            selectedEmails={selectedEmails}
            onSlotsFound={(slots) => {
              setAvailableSlots(slots)
              setError(null)
            }}
          />
        </div>

        <div>
          {booking ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Booking meeting...</p>
                <p className="text-sm text-gray-500 mt-1">Creating calendar events and sending invites</p>
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