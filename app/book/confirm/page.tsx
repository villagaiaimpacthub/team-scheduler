'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { format } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
}

export default function ConfirmMeetingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    // Get data from sessionStorage
    const emails = sessionStorage.getItem('selectedEmails')
    const dateStr = sessionStorage.getItem('selectedDate')
    const timeSlot = sessionStorage.getItem('selectedTimeSlot')

    if (!emails || !dateStr || !timeSlot) {
      router.push('/')
      return
    }

    try {
      setSelectedEmails(JSON.parse(emails))
      setSelectedDate(new Date(dateStr))
      setSelectedTimeSlot(JSON.parse(timeSlot))
      
      // Set default title
      const participants = JSON.parse(emails)
      setTitle(`Team Meeting - ${participants.length + 1} participants`)
    } catch {
      router.push('/')
    }
  }, [user, loading, router])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'h:mm a')
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const handleBookMeeting = async () => {
    if (!selectedTimeSlot || !title.trim()) {
      setError('Please provide a meeting title')
      return
    }

    try {
      setBooking(true)
      setError(null)
      
      const response = await fetch('/api/book-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startTime: selectedTimeSlot.start,
          endTime: selectedTimeSlot.end,
          duration: 60, // 1 hour
          participants: selectedEmails
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to book meeting')
      }

      const result = await response.json()
      
      // Store booking result and navigate to success page
      sessionStorage.setItem('bookingResult', JSON.stringify(result))
      
      // Clear other session data
      sessionStorage.removeItem('selectedEmails')
      sessionStorage.removeItem('availabilityData')
      sessionStorage.removeItem('searchParams')
      sessionStorage.removeItem('selectedDate')
      sessionStorage.removeItem('daySlots')
      sessionStorage.removeItem('selectedTimeSlot')
      
      router.push('/book/success')
    } catch (error) {
      console.error('Error booking meeting:', error)
      setError(error instanceof Error ? error.message : 'Failed to book meeting')
    } finally {
      setBooking(false)
    }
  }

  const handleBack = () => {
    router.push('/book/time-slots')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || !selectedDate || !selectedTimeSlot) {
    return null
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="CheckCircle" className="h-8 w-8 text-[var(--primary)]" />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Confirm Meeting</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">Review your meeting details before booking</p>
        </div>

        {/* Meeting Details */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Icon name="Calendar" className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-xl font-semibold">Meeting Details</h3>
          </div>

          <div className="space-y-4">
            {/* Date and Time */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Icon name="Calendar" className="h-5 w-5 text-[var(--muted-foreground)]" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-[var(--muted-foreground)]">When the meeting will take place</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatDate(selectedDate)}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Icon name="Clock" className="h-5 w-5 text-[var(--muted-foreground)]" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Meeting length</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">1 hour</p>
              </div>
            </div>

            {/* Participants */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Icon name="Users" className="h-5 w-5 text-[var(--muted-foreground)]" />
                <div>
                  <p className="font-medium">Participants</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Meeting attendees</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{selectedEmails.length + 1} people</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Participants List */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Users" className="h-5 w-5" />
            <h3 className="font-semibold">Meeting Attendees</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-medium">
                  You
                </div>
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Organizer</p>
                </div>
              </div>
            </div>
            {selectedEmails.map((email, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] flex items-center justify-center text-sm font-medium">
                    {email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{email}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Attendee</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Meeting Info Form */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Edit" className="h-5 w-5" />
            <h3 className="font-semibold">Meeting Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meeting title"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add agenda or meeting details"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
              />
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card>
            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <Icon name="AlertCircle" className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Button
            onClick={handleBack}
            variant="outline"
            size="lg"
            disabled={booking}
          >
            <Icon name="ArrowLeft" className="mr-2 h-5 w-5" />
            Back
          </Button>
          
          <Button
            onClick={handleBookMeeting}
            loading={booking}
            size="lg"
            className="min-w-[200px]"
            disabled={!title.trim()}
          >
            {booking ? (
              'Booking Meeting...'
            ) : (
              <>
                <Icon name="Calendar" className="mr-2 h-5 w-5" />
                Book This Time
              </>
            )}
          </Button>
        </div>

        {/* Final Info */}
        <div className="text-center text-xs text-[var(--muted-foreground)] space-y-1">
          <p>• Calendar invites will be sent to all participants</p>
          <p>• Google Meet link will be automatically generated</p>
          <p>• All attendees will receive email notifications</p>
        </div>
      </div>
    </div>
  )
}