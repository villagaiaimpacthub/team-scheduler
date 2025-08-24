'use client'

import React, { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export function GoogleCalendarView() {
  const [events, setEvents] = useState<any[]>([])
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)

  const theme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

  useEffect(() => {
    if (!range) return
    const load = async () => {
      const res = await fetch(`/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`, { cache: 'no-store', credentials: 'include' })
      const json = await res.json()
      if (res.ok) setEvents(json.events || [])
    }
    load()
  }, [range])

  const calendarStyles = useMemo(() => ({
    backgroundColor: 'var(--card)',
    color: 'var(--card-foreground)'
  }), [])

  return (
    <div className="rounded-lg border border-[color:var(--border)] p-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        height="auto"
        events={events}
        datesSet={(arg) => setRange({ start: arg.startStr, end: arg.endStr })}
        displayEventTime
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: true }}
        themeSystem="standard"
        dayMaxEventRows
        slotMinTime="09:00:00"
        slotMaxTime="17:00:00"
        expandRows
        aspectRatio={1.5}
        moreLinkClick="popover"
        locale="en"
        navLinks
        weekNumbers={false}
        nowIndicator
        dayHeaderClassNames={() => ['text-[var(--muted-foreground)]']}
        eventClassNames={() => ['bg-[var(--primary)] !border-none text-[var(--primary-foreground)]']}
        viewDidMount={() => {
          const el = document.querySelector('.fc') as HTMLElement | null
          if (el) {
            el.style.backgroundColor = 'var(--card)'
            el.style.color = 'var(--card-foreground)'
          }
        }}
        contentHeight="auto"
      />
    </div>
  )
}


