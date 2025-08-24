'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

export function GoogleCalendarView() {
  const [events, setEvents] = useState<any[]>([])
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [view] = useState<'dayGridMonth'>('dayGridMonth')
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
  // Month-only view; Week/Day removed

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
        <div className="text-sm text-[var(--muted-foreground)]">Month</div>
      </div>

      <div className="relative rounded-md border border-[color:var(--border)]">
        <FullCalendar
          ref={calendarRef as any}
          plugins={[dayGridPlugin, interactionPlugin]}
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
          aspectRatio={1.2}
          moreLinkClick="popover"
          locale="en"
          navLinks
          weekNumbers={false}
          nowIndicator
          dayHeaderClassNames={() => ['text-[var(--muted-foreground)]']}
          eventClassNames={() => [
            'bg-[var(--primary)] !border-none text-[var(--primary-foreground)] rounded-md shadow-sm',
            'ring-1 ring-[color:var(--border)] hover:ring-[color:var(--foreground)]',
            'transition'
          ]}
          eventDidMount={(info) => {
            const el = info.el as HTMLElement
            el.style.backgroundColor = 'var(--primary)'
            el.style.color = 'var(--primary-foreground)'
            el.style.border = 'none'
          }}
          slotDuration="00:30:00"
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: true }}
          allDaySlot={false}
          eventContent={(arg) => {
            const timeText = arg.timeText
            const title = arg.event.title
            const isSmall = typeof window !== 'undefined' && window.innerWidth < 640
            const html = isSmall
              ? `<div class=\"px-1 py-0.5\"><div class=\"text-[10px] leading-tight\">${title}</div></div>`
              : `<div class=\"px-2 py-1\">\n                   <div class=\"text-xs opacity-90\">${timeText}</div>\n                   <div class=\"text-sm font-medium leading-tight\">${title}</div>\n                 </div>`
            return { html }
          }}
          eventMouseEnter={(info) => {
            const rect = (info.el as HTMLElement).getBoundingClientRect()
            const timeText = info.timeText
            // Improve hover contrast
            const el = info.el as HTMLElement
            el.style.boxShadow = '0 0 0 2px var(--foreground) inset, 0 1px 2px rgba(0,0,0,0.2)'
            el.style.filter = 'brightness(0.95)'
            setTooltip({ x: rect.right + 8, y: rect.top + 8, title: info.event.title, time: timeText })
          }}
          eventMouseLeave={(info) => {
            const el = info.el as HTMLElement
            el.style.boxShadow = ''
            el.style.filter = ''
            setTooltip(null)
          }}
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



