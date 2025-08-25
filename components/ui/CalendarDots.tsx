'use client'

import * as React from 'react'
import { Calendar as ShadcnCalendar } from './calendar'

type MeetingsByDay = Record<string, number>

// Converts a Date into a YYYY-MM-DD key used for grouping meetings
function util_toDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

// Month calendar with small red dots indicating meetings per day
export function CalendarDots({ month, onSelect, meetingsByDay, onMonthChange }: { month: Date; onSelect: (d: Date) => void; meetingsByDay: MeetingsByDay; onMonthChange?: (m: Date) => void }) {
  return (
    <ShadcnCalendar
      mode="single"
      month={month}
      onMonthChange={onMonthChange}
      onDayClick={(d) => onSelect(d)}
      showOutsideDays
      weekStartsOn={0}
      className="rounded-lg"
      components={{
        Day: (props) => {
          const key = util_toDayKey(props.date)
          const count = meetingsByDay[key] || 0
          return (
            <button {...props.buttonProps} className={props.className}>
              <span className="text-sm leading-none">{props.date.getDate()}</span>
              {count > 0 && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-red-500" />
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



