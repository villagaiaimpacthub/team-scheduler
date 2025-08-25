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
    const qs = `start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&debug=1`
    fetch(`/api/events?${qs}`, { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) {
          console.error('[month] events error', j)
          setEvents([])
          return
        }
        setEvents(j.events || [])
      })
      .catch((e) => {
        console.error('[month] fetch failed', e)
        setEvents([])
      })
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
        onMonthChange={(m) => setMonth(m)}
        onSelect={(d) => setSelectedDay(d)}
      />

      <Card>
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-semibold">
            {selectedDay ? (
              `Meetings for ${format(selectedDay, 'EEEE, MMM d, yyyy')}`
            ) : (
              'Select a day to see meetings'
            )}
          </h3>

          {dayEvents.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-sm text-[var(--muted-foreground)]">
                {selectedDay ? 'No meetings scheduled for this day' : 'Click on a date to view meetings'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((e) => (
                <div key={e.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    {e.start ? format(new Date(e.start), 'h:mm a') : ''}
                    {e.end ? ` – ${format(new Date(e.end), 'h:mm a')}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}


