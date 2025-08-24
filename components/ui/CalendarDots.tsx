'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

type MeetingsByDay = Record<string, number>

// Format: YYYY-MM-DD
function toKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function CalendarDots({ month, onSelect, meetingsByDay }: { month: Date; onSelect: (d: Date) => void; meetingsByDay: MeetingsByDay }) {
  return (
    <DayPicker
      mode="single"
      month={month}
      onDayClick={(d) => onSelect(d)}
      showOutsideDays
      weekStartsOn={0}
      className="rounded-lg border border-[color:var(--border)] bg-[var(--card)] text-[var(--card-foreground)]"
      classNames={{
        day: 'relative h-9 w-9 p-0 text-center hover:bg-[color:var(--muted)]/40 rounded-md',
        day_today: 'ring-1 ring-[color:var(--primary)]',
        day_selected: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
      }}
      components={{
        Day: (props) => {
          const key = toKey(props.date)
          const count = meetingsByDay[key] || 0
          return (
            <button {...props.buttonProps} className={props.className}>
              <span>{props.displayLabel}</span>
              {count > 0 && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  ))}
                </span>
              )}
            </button>
          )
        }
      }}
    />
  )
}


