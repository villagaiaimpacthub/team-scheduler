'use client'

import { useMemo, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'

type Slot = { start: string; end: string }

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dateRange = useMemo(() => {
    if (!date) return { start: '', end: '' }
    const start = new Date(date)
    start.setHours(0,0,0,0)
    const end = new Date(date)
    end.setHours(23,59,59,999)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [date])

  const findTimes = async () => {
    try {
      setLoading(true)
      setError(null)
      // Simplified demo: request availability for current user only
      const res = await fetch('/api/availability?debug=1', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: [], duration: 30, daysToCheck: 3 })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to load times')
      }
      const j = await res.json()
      const day = (j.slots || []).filter((s: Slot) => s.start >= dateRange.start && s.start <= dateRange.end)
      setSlots(day)
    } catch (e:any) {
      setError(e?.message || 'Failed to load times')
    } finally {
      setLoading(false)
    }
  }

  const book = async () => {
    if (!selectedSlot) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/book-meeting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '30 Minute Meeting', description: notes, startTime: selectedSlot.start, endTime: selectedSlot.end, duration: 30, participants: [] }) })
      if (!res.ok) throw new Error('Failed to schedule')
      const j = await res.json()
      setConfirmed(j)
    } catch (e:any) {
      setError(e?.message || 'Failed to schedule')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-6 bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] border-[rgb(var(--border))]">
          <h2 className="text-2xl font-bold mb-2">30 Minute Meeting</h2>
          <div className="space-y-2 text-sm text-[rgb(var(--muted-foreground))]">
            <div className="flex items-center gap-2"><Icon name="User" className="h-4 w-4" /> You</div>
            <div className="flex items-center gap-2"><Icon name="Calendar" className="h-4 w-4" /> {new Date(selectedSlot!.start).toLocaleString()}</div>
            <div className="flex items-center gap-2"><Icon name="Globe" className="h-4 w-4" /> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            <div className="flex items-center gap-2"><Icon name="Video" className="h-4 w-4" /> Web conferencing details to follow</div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 text-green-600 grid place-items-center mb-4">
              <Icon name="Check" className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">You are scheduled</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">A calendar invitation has been sent to your email address.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">
      <div className="rounded-lg border p-6 bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] border-[rgb(var(--border))]">
        <h2 className="text-2xl font-bold">30 Minute Meeting</h2>
        <div className="mt-4 space-y-3 text-sm text-[rgb(var(--muted-foreground))]">
          <div className="flex items-center gap-2"><Icon name="Clock" className="h-4 w-4" /> 30 min</div>
          <div className="flex items-center gap-2"><Icon name="Video" className="h-4 w-4" /> Web conferencing details provided upon confirmation.</div>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-4">Select a Date & Time</h3>
        <Card>
          <div className="p-4">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
            <div className="mt-4">
              <div className="text-sm text-[rgb(var(--muted-foreground))] mb-2">Time zone</div>
              <div className="flex items-center gap-2 text-sm"><Icon name="Globe" className="h-4 w-4" /> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            </div>
          </div>
        </Card>

        <div className="mt-4">
          {error && <div className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted-foreground))]">{error}</div>}
          <div className="grid gap-2 md:grid-cols-3 mt-2">
            {slots.map((s, i) => (
              <button key={i} onClick={() => setSelectedSlot(s)} className={`rounded-md border px-4 py-3 text-center ${selectedSlot?.start === s.start ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]' } border-[rgb(var(--border))]`}>
                {new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={findTimes} disabled={!date || loading} className="flex-1">{loading ? 'Loading…' : 'Load Times'}</Button>
            <Button onClick={book} disabled={!selectedSlot || loading} className="flex-1">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}


