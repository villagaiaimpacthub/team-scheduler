import { getCalendarServiceWithToken, findAvailableSlotsWithService } from "@/lib/google-calendar"
import { createClient } from "@supabase/supabase-js"
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

    const debug = request.nextUrl.searchParams.get('debug') === '1'
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { emails, duration, daysToCheck } = availabilitySchema.parse(body)

    // Include current user's email in the check
    const allEmails = [...emails, user.email]

    // Use a plain service-role client to reliably read the current user's token
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: selfToken, error: selfTokErr } = await admin
      .from('google_tokens')
      .select('access_token, expires_at')
      .eq('user_id', (user as any).id)
      .single()
    if (selfTokErr || !selfToken?.access_token) {
      return NextResponse.json({
        error: 'No Google Calendar access',
        hint: 'Please sign in with Google and grant Calendar permissions. Then retry.',
        who: user.email,
        ...(debug ? { details: selfTokErr?.message || 'no token for current user' } : {}),
      }, { status: 403 })
    }
    const service = getCalendarServiceWithToken(selfToken.access_token)

    // Find available slots using the service
    let slots
    try {
      slots = await findAvailableSlotsWithService({
        calendarService: service,
        emails: allEmails,
        duration,
        daysToCheck,
      })
    } catch (e: any) {
      return NextResponse.json({
        error: 'Calendar free/busy failed',
        hint: 'Verify Calendar API enabled and that selected users granted access or domain free/busy is visible.',
        who: user.email,
        ...(debug ? { details: String(e?.message || e) } : {}),
      }, { status: 502 })
    }

    // Just-in-time discovery from current events within the window
    const calendarService = service
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
      ...(debug ? { debug: { who: user.email, participants: allEmails } } : {}),
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
