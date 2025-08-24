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
    let list = [] as any[]
    try {
      list = await svc.listUserEventsWithAttendees(start, end)
    } catch (err: any) {
      console.error('[events] google error', err?.response?.data || err?.message || err)
      return NextResponse.json({ error: 'Google list events failed' }, { status: 502 })
    }
    console.log('[events] fetched count', list?.length || 0)

    // Map to FullCalendar event format
    const events = (list || []).map(e => {
      const startVal = (e.start?.dateTime as string) || ''
      const endVal = (e.end?.dateTime as string) || ''
      // Support all-day events where Google may return date without time
      const startIso = startVal && startVal.length > 10 ? startVal : (e.start?.dateTime as string)
      const endIso = endVal && endVal.length > 10 ? endVal : (e.end?.dateTime as string)
      return {
        id: e.id,
        title: e.summary || 'Busy',
        start: startIso,
        end: endIso,
        allDay: startIso?.length <= 10 || endIso?.length <= 10,
      }
    })
    console.log('[events] returning', events.length)

    return NextResponse.json({ events })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load events', details: String(e?.message || e) }, { status: 500 })
  }
}


