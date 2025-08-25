"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"
import { DayPicker, getDefaultClassNames, DayButton } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: "default" | "outline" | "ghost"
  meetingsByDay?: Record<string, number>
  onDayClick?: (date: Date) => void
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  meetingsByDay = {},
  onDayClick,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-4 mb-4 border rounded-lg [--cell-size:2.5rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        className
      )}
      captionLayout={captionLayout}
      onDayClick={onDayClick}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center justify-between w-full absolute top-0 inset-x-0 px-2",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "size-[--cell-size] hover:bg-accent hover:text-accent-foreground aria-disabled:opacity-50 p-0 select-none rounded-md",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "size-[--cell-size] hover:bg-accent hover:text-accent-foreground aria-disabled:opacity-50 p-0 select-none rounded-md",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-[--cell-size] w-full px-[--cell-size]",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-[--cell-size] gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none h-[--cell-size] flex items-center justify-center",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        day: cn(
          "relative w-full h-full p-0 text-center aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "font-semibold text-primary",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ day, modifiers, ...props }) => {
          const dayKey = day.date.toISOString().slice(0, 10)
          const meetingCount = meetingsByDay[dayKey] || 0
          
          const ref = React.useRef<HTMLButtonElement>(null)
          React.useEffect(() => {
            if (modifiers.focused) ref.current?.focus()
          }, [modifiers.focused])

          return (
            <button
              ref={ref}
              data-day={day.date.toLocaleDateString()}
              data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
              }
              data-range-start={modifiers.range_start}
              data-range-end={modifiers.range_end}
              data-range-middle={modifiers.range_middle}
              className={cn(
                // Selected state - outline circle
                "data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-foreground data-[selected-single=true]:ring-2 data-[selected-single=true]:ring-primary",
                "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
                "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                // Hover state - white/black circle background
                "hover:bg-foreground hover:text-background dark:hover:bg-background dark:hover:text-foreground",
                "focus:bg-foreground focus:text-background dark:focus:bg-background dark:focus:text-foreground",
                "transition-all duration-150 ease-in-out",
                "flex aspect-square size-[--cell-size] w-full min-w-[--cell-size] flex-col items-center justify-center",
                "rounded-full font-normal text-sm leading-none cursor-pointer",
                "relative",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                // Ensure hover effects don't apply to selected state
                "data-[selected-single=true]:hover:bg-transparent data-[selected-single=true]:hover:text-foreground",
                defaultClassNames.day,
                props.className
              )}
              {...props}
            >
              <span>{day.date.getDate()}</span>
              {meetingCount > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(meetingCount, 3) }).map((_, i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-red-500" />
                  ))}
                </div>
              )}
            </button>
          )
        },
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
      }}
      {...props}
    />
  )
}


