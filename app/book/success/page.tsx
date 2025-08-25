'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { format } from 'date-fns'

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

export default function SuccessPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    // Get booking result from sessionStorage
    const result = sessionStorage.getItem('bookingResult')
    
    if (!result) {
      router.push('/')
      return
    }

    try {
      setBookingResult(JSON.parse(result))
    } catch {
      router.push('/')
    }
  }, [user, loading, router])

  const handleStartOver = () => {
    // Clear any remaining session data
    sessionStorage.removeItem('bookingResult')
    router.push('/')
  }

  const handleViewMeetings = () => {
    router.push('/meetings')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, 'EEEE, MMMM d, yyyy'),
      time: format(date, 'h:mm a')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || !bookingResult) {
    return null
  }

  const { date, time } = formatDateTime(bookingResult.meeting.startTime)
  const endTime = formatDateTime(bookingResult.meeting.endTime).time

  return (
    <div className="min-h-screen p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Icon name="CheckCircle" className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              Meeting Booked Successfully!
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Your team meeting has been scheduled and invitations have been sent
            </p>
          </div>
        </div>

        {/* Meeting Summary */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Icon name="Calendar" className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-xl font-semibold">Meeting Summary</h3>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="text-center p-4 rounded-lg bg-[var(--muted)]/50">
              <h4 className="text-lg font-semibold mb-1">{bookingResult.meeting.title}</h4>
              <p className="text-sm text-[var(--muted-foreground)]">Meeting ID: {bookingResult.meeting.id.slice(0, 8)}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg border border-[var(--border)]">
                <Icon name="Calendar" className="h-6 w-6 mx-auto mb-2 text-[var(--primary)]" />
                <p className="font-semibold">{date}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Meeting Date</p>
              </div>
              
              <div className="text-center p-4 rounded-lg border border-[var(--border)]">
                <Icon name="Clock" className="h-6 w-6 mx-auto mb-2 text-[var(--primary)]" />
                <p className="font-semibold">{time} - {endTime}</p>
                <p className="text-sm text-[var(--muted-foreground)]">1 hour duration</p>
              </div>
            </div>

            {/* Participants */}
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Users" className="h-5 w-5 text-[var(--primary)]" />
                <p className="font-semibold">Participants ({bookingResult.meeting.participants.length + 1})</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)]">
                  You (organizer)
                </span>
                {bookingResult.meeting.participants.map((email, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--muted)] text-[var(--foreground)]"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>

            {/* Meeting Link */}
            {bookingResult.meeting.meetingLink && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Video" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Google Meet Link</p>
                </div>
                <a
                  href={bookingResult.meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all"
                >
                  {bookingResult.meeting.meetingLink}
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Confirmation Details */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="CheckCircle" className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">What happens next?</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Icon name="Mail" className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p>✅ Calendar invites sent to all participants</p>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="Calendar" className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p>✅ Google Calendar events created</p>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="Bell" className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p>✅ Meeting notifications enabled</p>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="Video" className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p>✅ Google Meet link automatically generated</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            onClick={handleViewMeetings}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            <Icon name="Calendar" className="mr-2 h-5 w-5" />
            View My Meetings
          </Button>
          
          <Button
            onClick={handleStartOver}
            size="lg"
            className="min-w-[200px]"
          >
            <Icon name="Plus" className="mr-2 h-5 w-5" />
            Schedule Another Meeting
          </Button>
        </div>

        {/* Final Message */}
        <div className="text-center p-4 rounded-lg bg-[var(--muted)]/30">
          <p className="text-sm text-[var(--muted-foreground)]">
            Thank you for using Team Scheduler! All participants will receive their invitations shortly.
          </p>
        </div>
      </div>
    </div>
  )
}