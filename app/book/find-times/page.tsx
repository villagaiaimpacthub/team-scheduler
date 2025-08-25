'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Card } from '@/components/ui/Card'

export default function FindTimesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [daysToCheck, setDaysToCheck] = useState(14)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    // Get selected emails from sessionStorage
    const emails = sessionStorage.getItem('selectedEmails')
    if (!emails) {
      router.push('/')
      return
    }

    try {
      setSelectedEmails(JSON.parse(emails))
    } catch {
      router.push('/')
    }
  }, [user, loading, router])

  const handleFindTimes = async () => {
    if (selectedEmails.length === 0) {
      setError('No team members selected')
      return
    }

    try {
      setSearchLoading(true)
      setError(null)
      
      const response = await fetch('/api/availability?debug=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: selectedEmails,
          duration: 60, // 1 hour default
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
      
      // Store availability data and proceed to calendar
      sessionStorage.setItem('availabilityData', JSON.stringify(data))
      sessionStorage.setItem('searchParams', JSON.stringify({ daysToCheck, duration: 60 }))
      
      if (!data.slots || data.slots.length === 0) {
        setError('No common available times found. Try extending the search period or selecting fewer people.')
        return
      }

      router.push('/book/calendar')
    } catch (error) {
      console.error('Error checking availability:', error)
      setError(error instanceof Error ? error.message : 'Failed to check availability')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || selectedEmails.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Search" className="h-8 w-8 text-[var(--primary)]" />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Find Available Times</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">Choose your search parameters</p>
        </div>

        {/* Selected Members Summary */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Users" className="h-5 w-5" />
            <h3 className="font-semibold">Selected Team Members</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
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
          <p className="text-sm text-[var(--muted-foreground)]">
            Total participants: {selectedEmails.length + 1}
          </p>
        </Card>

        {/* Meeting Details */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Clock" className="h-5 w-5" />
            <h3 className="font-semibold">Meeting Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Duration:</span>
              <span className="font-medium">1 hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Time slots:</span>
              <span className="font-medium">Business hours only</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Days:</span>
              <span className="font-medium">Weekdays (Mon-Fri)</span>
            </div>
          </div>
        </Card>

        {/* Search Period Selection */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Calendar" className="h-5 w-5" />
            <h3 className="font-semibold">Search Period</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              How far in advance should we search for available times?
            </p>
            <select
              value={daysToCheck}
              onChange={(e) => setDaysToCheck(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 2 weeks (recommended)</option>
              <option value={21}>Next 3 weeks</option>
              <option value={30}>Next month</option>
            </select>
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
          >
            <Icon name="ArrowLeft" className="mr-2 h-5 w-5" />
            Back
          </Button>
          
          <Button
            onClick={handleFindTimes}
            loading={searchLoading}
            size="lg"
            className="min-w-[200px]"
          >
            {searchLoading ? (
              'Searching calendars...'
            ) : (
              <>
                <Icon name="Search" className="mr-2 h-5 w-5" />
                Find Times
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-[var(--muted-foreground)] space-y-1">
          <p>• Searches across all selected calendars simultaneously</p>
          <p>• Only shows times when everyone is available</p>
          <p>• Respects working hours and time zones</p>
        </div>
      </div>
    </div>
  )
}