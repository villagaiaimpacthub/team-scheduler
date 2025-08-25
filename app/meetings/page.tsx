import { MeetingsCalendarView } from '@/components/MeetingsCalendarView'

export default function MeetingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Your Meetings</h1>
        <p className="text-[var(--muted-foreground)]">
          View your scheduled meetings and click on any date to see the details.
        </p>
      </div>
      
      <MeetingsCalendarView />
    </div>
  )
}