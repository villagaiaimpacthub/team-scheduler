import { findAvailableSlots, getCalendarService } from "@/lib/google-calendar"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@supabase/ssr"
import { Database } from "@/types/database.types"

const availabilitySchema = z.object({
  emails: z.array(z.string().email()),
  duration: z.number().min(15).max(180).default(30),
  daysToCheck: z.number().min(1).max(14).default(7),
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { emails, duration, daysToCheck } = availabilitySchema.parse(body)

    // Include current user's email in the check
    const allEmails = [...emails, user.email]

    // Find available slots
    const slots = await findAvailableSlots({
      emails: allEmails,
      duration,
      daysToCheck,
    })

    // Just-in-time discovery from current events within the window
    const calendarService = await getCalendarService()
    const now = new Date()
    const endDate = new Date(now.getTime() + daysToCheck * 24 * 60 * 60 * 1000)
    const events = calendarService
      ? await calendarService.listUserEventsWithAttendees(now.toISOString(), endDate.toISOString())
      : []

    const companyDomain = process.env.COMPANY_DOMAIN
    const discoveredSet = new Set<string>()
    for (const ev of events) {
      ev.attendees?.forEach((a) => {
        const email = a.email?.toLowerCase()
        if (!email) return
        if (companyDomain && !email.endsWith(`@${companyDomain}`)) return
        if (!allEmails.map((e) => e.toLowerCase()).includes(email)) {
          discoveredSet.add(email)
        }
      })
    }

    return NextResponse.json({
      slots,
      participants: allEmails,
      duration,
      daysChecked: daysToCheck,
      suggestedTeammates: Array.from(discoveredSet),
    })
  } catch (error) {
    console.error("Error checking availability:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 })
  }
}
