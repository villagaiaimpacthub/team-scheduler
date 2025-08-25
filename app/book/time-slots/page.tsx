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

export default function TimeSlotsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    // Get data from sessionStorage
    const emails = sessionStorage.getItem('selectedEmails')
    const dateStr = sessionStorage.getItem('selectedDate')
    const slots = sessionStorage.getItem('daySlots')

    if (!emails || !dateStr || !slots) {
      router.push('/')
      return
    }

    try {
      setSelectedEmails(JSON.parse(emails))
      setSelectedDate(new Date(dateStr))
      setDaySlots(JSON.parse(slots))
    } catch {
      router.push('/')
    }
  }, [user, loading, router])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'h:mm a')
  }

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    // Store selected time slot
    sessionStorage.setItem('selectedTimeSlot', JSON.stringify(slot))
    
    // Navigate to confirmation
    router.push('/book/confirm')
  }

  const handleBack = () => {
    router.push('/book/calendar')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || !selectedDate || daySlots.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Clock" className="h-8 w-8 text-[var(--primary)]" />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Select Time</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">Choose your preferred meeting time</p>
        </div>

        {/* Selected Date Summary */}
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Icon name="Calendar" className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold">Selected Date</h3>
            </div>
            <p className="text-2xl font-bold mb-2">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {daySlots.length} available time slot{daySlots.length !== 1 ? 's' : ''} • {selectedEmails.length + 1} participants
            </p>
          </div>
        </Card>

        {/* Meeting Details */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Users" className="h-5 w-5" />
            <h3 className="font-semibold">Meeting Participants</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)]">
              You (organizer)
            </span>
            {selectedEmails.map((email, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--muted)] text-[var(--foreground)]"
              >
                {email}
              </span>
            ))}
          </div>
        </Card>

        {/* Time Slots */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Icon name="Clock" className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Available Times (1 hour each)</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {daySlots.map((slot, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                onClick={() => handleTimeSlotSelect(slot)}
              >
                <span className="text-lg font-semibold mb-1">
                  {formatTime(slot.start)}
                </span>
                <span className="text-sm opacity-75">
                  to {formatTime(slot.end)}
                </span>
              </Button>
            ))}
          </div>

          {daySlots.length === 0 && (
            <div className="text-center py-8">
              <Icon name="Clock" className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">
                No available time slots for this date
              </p>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Icon name="HelpCircle" className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="font-semibold">Next Steps</h3>
            </div>
            <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>• Click on any time slot to proceed to confirmation</p>
              <p>• All times are shown in your local timezone</p>
              <p>• Each meeting will be exactly 1 hour long</p>
            </div>
          </div>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleBack}
            variant="outline"
            size="lg"
          >
            <Icon name="ArrowLeft" className="mr-2 h-5 w-5" />
            Back to Calendar
          </Button>
        </div>
      </div>
    </div>
  )
}