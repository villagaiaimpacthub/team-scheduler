'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/button'
import { Icon } from './ui/Icon'
import { format } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[]
  duration: number
  participants: string[]
  onBooking: (slot: TimeSlot, title: string, description?: string) => void
}

export function TimeSlotSelector({ slots, duration, participants, onBooking }: TimeSlotSelectorProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [title, setTitle] = useState('Team Meeting')
  const [description, setDescription] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'EEE, MMM d • h:mm a')
  }

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setShowBookingForm(true)
  }

  const handleBooking = () => {
    if (selectedSlot && title.trim()) {
      onBooking(selectedSlot, title.trim(), description.trim() || undefined)
      setShowBookingForm(false)
      setSelectedSlot(null)
      setTitle('Team Meeting')
      setDescription('')
    }
  }

  if (slots.length === 0) {
    return null
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Calendar" className="h-5 w-5 text-[var(--primary)]" />
        <h3 className="text-lg font-semibold">
          Available Times ({slots.length} slots found)
        </h3>
      </div>

      {showBookingForm && selectedSlot ? (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
            <p className="text-sm font-medium">
              Selected: {formatDateTime(selectedSlot.start)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Duration: {duration} minutes • {participants.length + 1} participants
            </p>
          </div>

          <div>
            <label className="label">Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Meeting agenda or notes"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBooking}
              variant="success"
              disabled={!title.trim()}
              className="flex-1"
            >
              <Icon name="Video" className="h-4 w-4 mr-2" />
              Book Meeting
            </Button>
            <Button
              onClick={() => setShowBookingForm(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2">
            {slots.map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg transition-colors border bg-[var(--card)] hover:bg-[var(--muted)] border-[color:var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <Icon name="Calendar" className="h-4 w-4" />
                  <div>
                    <p className="font-medium text-sm">
                      {formatDateTime(slot.start)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {duration} minutes • {participants.length + 1} participants
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleSlotClick(slot)}
                >
                  Book This Time
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--muted-foreground)] text-center">
            Times shown are when all participants are available
          </p>
        </div>
      )}
    </Card>
  )
}