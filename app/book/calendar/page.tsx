'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { format } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
}

interface AvailabilityData {
  slots: TimeSlot[]
}

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({ slots: [] })
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [searchParams, setSearchParams] = useState<any>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    // Get data from sessionStorage
    const emails = sessionStorage.getItem('selectedEmails')
    const availability = sessionStorage.getItem('availabilityData')
    const params = sessionStorage.getItem('searchParams')

    if (!emails || !availability || !params) {
      router.push('/')
      return
    }

    try {
      setSelectedEmails(JSON.parse(emails))
      setAvailabilityData(JSON.parse(availability))
      setSearchParams(JSON.parse(params))
    } catch {
      router.push('/')
    }
  }, [user, loading, router])

  // Get available days as a record for the calendar
  const availableDaysByDate = useMemo(() => {
    const map: Record<string, boolean> = {}
    const availableDays = Array.from(new Set(
      availabilityData.slots.map((slot: TimeSlot) => 
        new Date(slot.start).toISOString().slice(0, 10)
      )
    ))
    
    availableDays.forEach(day => {
      map[day] = true
    })
    return map
  }, [availabilityData.slots])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const selectedKey = date.toISOString().slice(0, 10)
    
    // Get slots for this date
    const daySlots = availabilityData.slots.filter(slot => {
      const slotDate = new Date(slot.start)
      const slotKey = slotDate.toISOString().slice(0, 10)
      return slotKey === selectedKey
    })

    if (daySlots.length > 0) {
      // Store selected date and its slots
      sessionStorage.setItem('selectedDate', date.toISOString())
      sessionStorage.setItem('daySlots', JSON.stringify(daySlots))
      
      // Navigate to time selection
      router.push('/book/time-slots')
    }
  }

  const handleBack = () => {
    router.push('/book/find-times')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || selectedEmails.length === 0 || availabilityData.slots.length === 0) {
    return null
  }

  const availableDaysCount = Object.keys(availableDaysByDate).length
  const totalSlotsCount = availabilityData.slots.length

  return (
    <div className="min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Calendar" className="h-8 w-8 text-[var(--primary)]" />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Select Date</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">Choose an available date for your meeting</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <Icon name="Users" className="h-6 w-6 mx-auto mb-2 text-[var(--primary)]" />
              <p className="text-2xl font-bold">{selectedEmails.length + 1}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Participants</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <Icon name="Calendar" className="h-6 w-6 mx-auto mb-2 text-[var(--primary)]" />
              <p className="text-2xl font-bold">{availableDaysCount}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Available Days</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <Icon name="Clock" className="h-6 w-6 mx-auto mb-2 text-[var(--primary)]" />
              <p className="text-2xl font-bold">{totalSlotsCount}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Time Slots</p>
            </div>
          </Card>
        </div>

        {/* Calendar */}
        <div className="flex justify-center">
          <Card className="w-fit">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Info" className="h-4 w-4 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  Circles indicate days with available time slots
                </p>
              </div>
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
            </div>
          </Card>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Icon name="Calendar" className="h-5 w-5 text-[var(--primary)]" />
                <h3 className="text-lg font-semibold">Selected Date</h3>
              </div>
              <p className="text-xl font-medium mb-2">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Click a date with a circle to see available times
              </p>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Icon name="HelpCircle" className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="font-semibold">How to proceed</h3>
            </div>
            <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>• Look for dates marked with circles - these have available time slots</p>
              <p>• Click on any available date to see specific times</p>
              <p>• You'll then be able to select your preferred time slot</p>
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
            Back to Search
          </Button>
        </div>
      </div>
    </div>
  )
}