import { getCalendarServiceWithToken } from "@/lib/google-calendar"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@supabase/ssr"
import { refreshGoogleAccessToken } from "@/lib/auth-supabase"
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
    const timezone = body?.timezone || 'UTC'

    // Include current user's email and de-duplicate participants
    const allEmails = Array.from(new Set([...emails, user.email].map((e) => e.toLowerCase())))

    // Use a plain service-role client to reliably read the current user's token
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server misconfigured', hint: 'Missing SUPABASE_SERVICE_ROLE_KEY env var' }, { status: 500 })
    }
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
    // Build tokens for ALL participants using service-role (each user’s own token)
    const { data: usersForEmails } = await admin
      .from('users')
      .select('id,email')
      .in('email', allEmails)

    const emailToUserId = new Map<string, string>()
    for (const u of usersForEmails || []) emailToUserId.set(u.email, u.id)

    const tokenRows: Record<string, { access_token: string; expires_at: string | null }> = {}
    if ((usersForEmails || []).length) {
      const { data: rows } = await admin
        .from('google_tokens')
        .select('user_id,access_token,expires_at')
        .in('user_id', (usersForEmails || []).map(u => u.id))
      for (const r of rows || []) tokenRows[r.user_id] = { access_token: r.access_token, expires_at: r.expires_at as any }
    }

    // Refresh expiring tokens (5 min buffer) and build services
    const missing: string[] = []
    const services: Record<string, ReturnType<typeof getCalendarServiceWithToken>> = {}
    for (const email of allEmails) {
      const uid = emailToUserId.get(email)
      if (!uid) { missing.push(email); continue }
      let tok = tokenRows[uid]?.access_token
      const exp = tokenRows[uid]?.expires_at ? new Date(tokenRows[uid]!.expires_at as any).getTime() / 1000 : null
      const now = Date.now() / 1000
      if (!tok || (exp && exp < now + 300)) {
        try {
          const refreshed = await refreshGoogleAccessToken(uid)
          if (refreshed?.access_token) {
            tok = refreshed.access_token
            tokenRows[uid] = { access_token: tok, expires_at: new Date(refreshed.expires_at * 1000).toISOString() as any }
          }
        } catch {}
      }
      if (!tok) missing.push(email)
      else services[email] = getCalendarServiceWithToken(tok)
    }
    if (missing.length) {
      return NextResponse.json({
        error: 'Missing calendar consent for participants',
        missing,
        hint: 'Ask these users to sign in once to grant calendar access.',
        ...(debug ? { debug: { who: user.email, participants: allEmails } } : {}),
      }, { status: 403 })
    }

    // Compute free slot intersection across all participants
    const now = new Date()
    const endDate = new Date(now.getTime() + daysToCheck * 24 * 60 * 60 * 1000)
    const busyMap: Record<string, { start: string; end: string }[]> = {}
    try {
      for (const email of allEmails) {
        const svc = services[email]
        const fb = await svc.getFreeBusyInfo(now.toISOString(), endDate.toISOString(), [email])
        busyMap[email] = fb[email] || []
      }
    } catch (e: any) {
      return NextResponse.json({
        error: 'Calendar free/busy failed',
        details: debug ? String(e?.message || e) : undefined,
      }, { status: 502 })
    }

    const businessHours = { start: 9, end: 17 }
    const slotDurationMs = duration * 60 * 1000
    const slots: Array<{ start: string; end: string }> = []
    for (let d = 0; d < daysToCheck; d++) {
      const checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() + d)
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue
      for (let hour = businessHours.start; hour < businessHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(checkDate)
          slotStart.setHours(hour, minute, 0, 0)
          const slotEnd = new Date(slotStart.getTime() + slotDurationMs)
          if (slotStart < now) continue
          if (slotEnd.getHours() >= businessHours.end) break
          let freeForAll = true
          for (const email of allEmails) {
            const conflicts = (busyMap[email] || []).some((b) => {
              const bs = new Date(b.start); const be = new Date(b.end)
              return (slotStart >= bs && slotStart < be) || (slotEnd > bs && slotEnd <= be) || (slotStart <= bs && slotEnd >= be)
            })
            if (conflicts) { freeForAll = false; break }
          }
          if (freeForAll) {
            slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() })
            if (slots.length >= 10) break
          }
        }
      }
      if (slots.length >= 10) break
    }

    return NextResponse.json({
      slots,
      participants: allEmails,
      duration,
      daysChecked: daysToCheck,
      suggestedTeammates: [],
      ...(debug ? { debug: { who: user.email, participants: allEmails, timezone, busyMap } } : {}),
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
