'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Icon } from '@/components/ui/Icon'
import { format } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
}

interface AvailabilityData {
  slots: TimeSlot[]
  availableDays: string[] // ISO date strings for days with availability
}

interface BookingCalendarViewProps {
  selectedEmails: string[]
  duration: number
  onSlotsFound: (slots: TimeSlot[]) => void
  onSuggestionsFound?: (emails: string[]) => void
}

export function BookingCalendarView({ 
  selectedEmails, 
  duration = 30,
  onSlotsFound, 
  onSuggestionsFound 
}: BookingCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({ slots: [], availableDays: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysToCheck, setDaysToCheck] = useState(14)
  const timeSlotsRef = useRef<HTMLDivElement>(null)

  // Check availability when component mounts or when parameters change
  useEffect(() => {
    if (selectedEmails.length > 0) {
      checkAvailability()
    }
  }, [selectedEmails, duration, daysToCheck])

  const checkAvailability = async () => {
    if (selectedEmails.length === 0) {
      setError('Please select at least one team member')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/availability?debug=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: selectedEmails,
          duration,
          daysToCheck,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({} as any))
        const msg = err?.hint || err?.error || 'Failed to check availability'
        throw new Error(msg)
      }

      const data = await response.json()
      
      // Extract available days from slots
      const availableDays = Array.from(new Set(
        (data.slots || []).map((slot: TimeSlot) => 
          new Date(slot.start).toISOString().slice(0, 10)
        )
      ))
      
      setAvailabilityData({ 
        slots: data.slots || [], 
        availableDays 
      })
      
      if (data.suggestedTeammates?.length && onSuggestionsFound) {
        onSuggestionsFound(data.suggestedTeammates)
      }
      
      if (!data.slots || data.slots.length === 0) {
        setError('No common available times found. Try extending the search period or selecting fewer people.')
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      setError(error instanceof Error ? error.message : 'Failed to check availability')
    } finally {
      setLoading(false)
    }
  }

  // Get available days as a record for the calendar
  const availableDaysByDate = useMemo(() => {
    const map: Record<string, boolean> = {}
    availabilityData.availableDays.forEach(day => {
      map[day] = true
    })
    return map
  }, [availabilityData.availableDays])

  // Get time slots for the selected date
  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return []
    const selectedKey = selectedDate.toISOString().slice(0, 10)
    return availabilityData.slots.filter(slot => {
      const slotDate = new Date(slot.start)
      const slotKey = slotDate.toISOString().slice(0, 10)
      return slotKey === selectedKey
    })
  }, [selectedDate, availabilityData.slots])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onSlotsFound(selectedDateSlots)
    
    // Smooth scroll to time slots section
    setTimeout(() => {
      timeSlotsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }, 100)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'h:mm a')
  }

  if (selectedEmails.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Icon name="Users" className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">
            Select team members to find available meeting times
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Calendar Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Search" className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Find Available Times</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Search Period */}
          <div>
            <label className="label">
              <Icon name="Calendar" className="inline h-4 w-4 mr-1" />
              Search Period
            </label>
            <select
              value={daysToCheck}
              onChange={(e) => setDaysToCheck(Number(e.target.value))}
              className="input"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 2 weeks</option>
              <option value={21}>Next 3 weeks</option>
              <option value={30}>Next month</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div>
            <label className="label">&nbsp;</label>
            <Button
              onClick={checkAvailability}
              loading={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Checking...' : 'Refresh Availability'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-[var(--muted-foreground)] space-y-1">
          <p>• Available days shown with circles on calendar</p>
          <p>• Business hours only (9 AM - 5 PM, weekdays)</p>
          <p>• Shows times when all {selectedEmails.length + 1} people are free</p>
        </div>
      </Card>

      {/* Calendar */}
      {loading ? (
        <LoadingSpinner text="Checking availability..." />
      ) : (
        <div className="flex justify-center">
          <Card className="w-fit">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onDayClick={handleDateClick}
              availableDays={availableDaysByDate}
              captionLayout="dropdown"
              disabled={(date) => {
                // Disable past dates and dates without availability
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const dateKey = date.toISOString().slice(0, 10)
                return date < today || !availableDaysByDate[dateKey]
              }}
            />
          </Card>
        </div>
      )}

      {/* Time Slots Section */}
      <div ref={timeSlotsRef}>
        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Icon name="Clock" className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">
                {selectedDate 
                  ? `Available Times for ${format(selectedDate, 'EEEE, MMM d, yyyy')}`
                  : 'Select a date to view available times'
                }
              </h3>
            </div>

            {selectedDateSlots.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Clock" className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                <p className="text-[var(--muted-foreground)]">
                  {selectedDate && availableDaysByDate[selectedDate.toISOString().slice(0, 10)]
                    ? 'Loading available times...'
                    : selectedDate 
                    ? 'No available times for this day'
                    : 'Select an available date to see time options'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedDateSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-12 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      onSlotsFound([slot])
                      // Scroll to next section (handled by parent component)
                      const nextSection = document.querySelector('[data-section="booking"]')
                      if (nextSection) {
                        nextSection.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        })
                      }
                    }}
                  >
                    <span className="font-medium">
                      {formatTime(slot.start)}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {duration} min
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}