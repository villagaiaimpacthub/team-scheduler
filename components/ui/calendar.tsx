'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={['rounded-md border shadow-sm bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] border-[rgb(var(--border))]', className].filter(Boolean).join(' ')}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 p-3',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-[rgb(var(--muted-foreground))] rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative',
        day: 'h-9 w-9 p-0 font-normal rounded-full transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
        day_selected: 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))] hover:text-[rgb(var(--primary-foreground))] focus:bg-[rgb(var(--primary))] focus:text-[rgb(var(--primary-foreground))] rounded-md',
        day_today: 'rounded-md ring-1 ring-[rgb(var(--primary))] text-[rgb(var(--foreground))]',
        day_outside: 'text-[rgb(var(--muted-foreground))] opacity-60',
        day_disabled: 'text-[rgb(var(--muted-foreground))] opacity-50',
        day_range_middle: 'rounded-md bg-[rgb(var(--muted))]',
        day_hidden: 'invisible',
      }}
      {...props}
    />
  )
}


