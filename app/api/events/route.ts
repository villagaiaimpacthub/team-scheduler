import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { getCalendarServiceWithToken } from '@/lib/google-calendar'
import { getGoogleAccessTokenForUser } from '@/lib/auth-supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n) => request.cookies.get(n)?.value, set() {}, remove() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const start = request.nextUrl.searchParams.get('start')
    const end = request.nextUrl.searchParams.get('end')
    if (!start || !end) return NextResponse.json({ error: 'Missing start/end' }, { status: 400 })
    console.log('[events] range', { start, end })

    // Get valid access token (with automatic refresh)
    const accessToken = await getGoogleAccessTokenForUser((user as any).id)
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No calendar access - please reconnect your Google Calendar',
        requiresReauth: true 
      }, { status: 403 })
    }

    const svc = getCalendarServiceWithToken(accessToken)
    const debug = request.nextUrl.searchParams.get('debug') === '1'
    let list = [] as any[]
    try {
      list = await svc.listUserEventsWithAttendees(start, end)
    } catch (err: any) {
      const details = err?.response?.data || err?.message || String(err)
      console.error('[events] google error', details)
      return NextResponse.json(
        debug ? { error: 'Google list events failed', details } : { error: 'Google list events failed' },
        { status: 502 }
      )
    }
    console.log('[events] fetched count', list?.length || 0)

    // Map to FullCalendar event format
    const events = (list || []).map((e: any) => {
      const startVal: string | undefined = e.start?.dateTime || e.start?.date
      const endVal: string | undefined = e.end?.dateTime || e.end?.date
      const isAllDay = Boolean(e.start?.date && !e.start?.dateTime)
      return {
        id: e.id,
        title: e.summary || 'Busy',
        start: startVal,
        end: endVal,
        allDay: isAllDay,
      }
    })
    console.log('[events] returning', events.length)

    return NextResponse.json({ events })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load events', details: String(e?.message || e) }, { status: 500 })
  }
}


