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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; time: string } | null>(null)

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

      <div className="relative rounded-md border border-[color:var(--border)]">
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
          eventClassNames={() => [
            'bg-[var(--primary)] !border-none text-[var(--primary-foreground)] rounded-md shadow-sm hover:opacity-90 transition'
          ]}
          slotDuration="00:30:00"
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: true }}
          allDaySlot={false}
          eventContent={(arg) => {
            const timeText = arg.timeText
            const title = arg.event.title
            return {
              html: `<div class="px-2 py-1">
                       <div class="text-xs opacity-90">${timeText}</div>
                       <div class="text-sm font-medium leading-tight">${title}</div>
                     </div>`
            }
          }}
          eventMouseEnter={(info) => {
            const rect = (info.el as HTMLElement).getBoundingClientRect()
            const timeText = info.timeText
            setTooltip({ x: rect.right + 8, y: rect.top + 8, title: info.event.title, time: timeText })
          }}
          eventMouseLeave={() => setTooltip(null)}
          contentHeight="auto"
        />

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-md border border-[color:var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] px-3 py-2 shadow-md"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="text-xs opacity-80">{tooltip.time}</div>
            <div className="text-sm font-medium">{tooltip.title}</div>
          </div>
        )}
      </div>
    </Card>
  )
}



