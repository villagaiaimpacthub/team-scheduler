'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

interface TimeSlot {
  start: string
  end: string
}

interface AvailabilityCheckerProps {
  selectedEmails: string[]
  onSlotsFound: (slots: TimeSlot[]) => void
}

export function AvailabilityChecker({ selectedEmails, onSlotsFound }: AvailabilityCheckerProps) {
  const [duration, setDuration] = useState(30)
  const [daysToCheck, setDaysToCheck] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = async () => {
    if (selectedEmails.length === 0) {
      setError('Please select at least one team member')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: selectedEmails,
          duration,
          daysToCheck
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check availability')
      }

      const data = await response.json()
      onSlotsFound(data.slots || [])
      
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

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Search" className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Find Available Times</h3>
      </div>

      <div className="space-y-4">
        {/* Duration Selection */}
        <div>
          <label className="label">
            <Icon name="Clock" className="inline h-4 w-4 mr-1" />
            Meeting Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        {/* Days to Check */}
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
            <option value={3}>Next 3 days</option>
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 2 weeks</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Check Availability Button */}
        <Button
          onClick={checkAvailability}
          disabled={selectedEmails.length === 0}
          loading={loading}
          className="w-full"
        >
          {loading 
            ? 'Checking calendars...' 
            : `Find Times for ${selectedEmails.length + 1} People`
          }
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Searches business hours (9 AM - 5 PM, weekdays only)</p>
          <p>• Requires Google Calendar access for all participants</p>
          <p>• Shows times when everyone is available</p>
        </div>
      </div>
    </Card>
  )
}