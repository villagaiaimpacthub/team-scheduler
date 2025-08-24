import { getCalendarServiceWithToken } from "@/lib/google-calendar";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bookingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  participants: z.array(z.string().email()),
});

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n) => request.cookies.get(n)?.value, set() {}, remove() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email || !(user as any).id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const debug = request.nextUrl.searchParams.get('debug') === '1'
    const body = await request.json();
    const { title, description, startTime, endTime, duration, participants } = bookingSchema.parse(body);

    // Get current user's Google token via service-role
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: tokenRow, error: tokErr } = await admin
      .from('google_tokens')
      .select('access_token, expires_at')
      .eq('user_id', (user as any).id)
      .single()
    if (tokErr || !tokenRow?.access_token) {
      return NextResponse.json({ error: "No calendar access - please sign in" }, { status: 403 })
    }
    const calendarService = getCalendarServiceWithToken(tokenRow.access_token)

    console.log("Creating meeting:", { title, startTime, endTime, participants });

    // Prepare attendees list (including organizer)
    const allAttendees = [...participants, user.email];
    const attendees = allAttendees.map((email) => ({ email }));

    // Create Google Calendar event
    const calendarEvent = await calendarService.createEvent({
      summary: title,
      description:
        description ||
        `Team meeting scheduled via Team Scheduler\n\nParticipants:\n${allAttendees
          .map((email) => `• ${email}`)
          .join("\n")}`,
      start: {
        dateTime: startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees,
    });

    console.log("Calendar event created:", calendarEvent.id);

    // Store meeting in database using Supabase
    // Insert using service-role (bypass RLS recursion on users policies)
    const adminDb = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: meeting, error: meetingError } = await adminDb
      .from("meetings")
      .insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        duration,
        location: calendarEvent.hangoutLink || "",
        google_event_id: calendarEvent.id,
        organizer_id: (user as any).id,
        participants,
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Error saving meeting to database:", meetingError);
      if (debug) {
        return NextResponse.json({ error: "Failed to save meeting", details: meetingError.message }, { status: 500 })
      }
      throw new Error("Failed to save meeting");
    }

    console.log("Meeting saved to database:", meeting.id);

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        participants: meeting.participants,
        meetingLink: calendarEvent.hangoutLink,
        calendarEventId: calendarEvent.id,
      },
    });
  } catch (error) {
    console.error("Error booking meeting:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to book meeting" }, { status: 500 });
  }
}
