import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { getCalendarServiceWithToken } from '@/lib/google-calendar'

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

    // Service-role to get token
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: tok } = await admin
      .from('google_tokens')
      .select('access_token')
      .eq('user_id', (user as any).id)
      .single()
    if (!tok?.access_token) return NextResponse.json({ error: 'No calendar access' }, { status: 403 })

    const svc = getCalendarServiceWithToken(tok.access_token)
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


