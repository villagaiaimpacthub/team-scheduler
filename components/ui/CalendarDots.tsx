'use client'

import * as React from 'react'
import { Calendar as ShadcnCalendar } from './calendar'

type MeetingsByDay = Record<string, number>

// Converts a Date into a YYYY-MM-DD key used for grouping meetings
function util_toDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

// Month calendar with small red dots indicating meetings per day
export function CalendarDots({ 
  month, 
  onSelect, 
  meetingsByDay, 
  onMonthChange 
}: { 
  month: Date; 
  onSelect: (d: Date) => void; 
  meetingsByDay: MeetingsByDay; 
  onMonthChange?: (m: Date) => void 
}) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      onSelect(date)
    }
  }

  const handleDayClick = (date: Date) => {
    handleSelect(date)
  }

  return (
    <ShadcnCalendar
      mode="single"
      selected={selectedDate}
      onSelect={handleSelect}
      onDayClick={handleDayClick}
      month={month}
      onMonthChange={onMonthChange}
      meetingsByDay={meetingsByDay}
      showOutsideDays
      weekStartsOn={0}
      className="rounded-lg border shadow-sm"
      captionLayout="dropdown"
    />
  )
}



