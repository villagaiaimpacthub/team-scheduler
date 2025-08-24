'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDots } from './ui/CalendarDots'
import { Card } from './ui/Card'
import { format } from 'date-fns'

interface EventItem {
  id: string
  title: string
  start: string
  end?: string
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function MeetingsMonth() {
  const [month, setMonth] = useState(new Date())
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const qs = `start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
    fetch(`/api/events?${qs}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setEvents(j.events || []))
      .catch(() => setEvents([]))
  }, [month])

  const meetingsByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of events) {
      const d = new Date(e.start)
      const key = toKey(d)
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [events])

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [] as EventItem[]
    const key = toKey(selectedDay)
    return events.filter((e) => toKey(new Date(e.start)) === key)
  }, [selectedDay, events])

  return (
    <div className="space-y-4">
      <CalendarDots
        month={month}
        meetingsByDay={meetingsByDay}
        onSelect={(d) => setSelectedDay(d)}
      />

      <Card>
        <div className="p-4 space-y-2">
          {selectedDay ? (
            <div className="text-sm text-[var(--muted-foreground)]">
              {format(selectedDay, 'EEEE, MMM d, yyyy')}
            </div>
          ) : (
            <div className="text-sm text-[var(--muted-foreground)]">Select a day to see meetings</div>
          )}

          {dayEvents.length === 0 ? (
            <div className="text-sm">No meetings</div>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {dayEvents.map((e) => (
                <li key={e.id} className="py-2">
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {e.start ? format(new Date(e.start), 'h:mm a') : ''}
                    {e.end ? ` – ${format(new Date(e.end), 'h:mm a')}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}


