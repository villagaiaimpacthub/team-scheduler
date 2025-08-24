'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

export function GoogleCalendarView() {
  const [events, setEvents] = useState<any[]>([])
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek')
  const calendarRef = useRef<FullCalendar | null>(null)

  useEffect(() => {
    if (!range) return
    const load = async () => {
      const res = await fetch(`/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`, { cache: 'no-store', credentials: 'include' })
      const json = await res.json()
      if (res.ok) setEvents(json.events || [])
    }
    load()
  }, [range])

  const onPrev = () => {
    const api = calendarRef.current?.getApi?.()
    api?.prev()
  }
  const onNext = () => {
    const api = calendarRef.current?.getApi?.()
    api?.next()
  }
  const onToday = () => {
    const api = calendarRef.current?.getApi?.()
    api?.today()
  }
  const changeView = (v: typeof view) => {
    setView(v)
    const api = calendarRef.current?.getApi?.()
    api?.changeView(v)
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev}>
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onNext}>
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onToday}>
            <Icon name="Calendar" className="h-4 w-4 mr-1" /> Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'dayGridMonth' ? 'default' : 'outline'} size="sm" onClick={() => changeView('dayGridMonth')}>Month</Button>
          <Button variant={view === 'timeGridWeek' ? 'default' : 'outline'} size="sm" onClick={() => changeView('timeGridWeek')}>Week</Button>
          <Button variant={view === 'timeGridDay' ? 'default' : 'outline'} size="sm" onClick={() => changeView('timeGridDay')}>Day</Button>
        </div>
      </div>

      <div className="rounded-md border border-[color:var(--border)]">
        <FullCalendar
          ref={calendarRef as any}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={false}
          height="auto"
          events={events}
          datesSet={(arg) => setRange({ start: arg.startStr, end: arg.endStr })}
          displayEventTime
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: true }}
          themeSystem="standard"
          dayMaxEventRows
          expandRows
          aspectRatio={1.5}
          moreLinkClick="popover"
          locale="en"
          navLinks
          weekNumbers={false}
          nowIndicator
          dayHeaderClassNames={() => ['text-[var(--muted-foreground)]']}
          eventClassNames={() => ['bg-[var(--primary)] !border-none text-[var(--primary-foreground)]']}
          contentHeight="auto"
        />
      </div>
    </Card>
  )
}



