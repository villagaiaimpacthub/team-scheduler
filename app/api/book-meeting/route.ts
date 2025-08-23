import { getServerSession } from "@/lib/auth-supabase";
import { getCalendarService } from "@/lib/google-calendar";
import { createSupabaseServerClient } from "@/lib/supabase-server";
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startTime, endTime, duration, participants } = bookingSchema.parse(body);

    // Get calendar service
    const calendarService = await getCalendarService();
    if (!calendarService) {
      return NextResponse.json(
        { error: "No calendar access. Please reconnect your Google Calendar." },
        { status: 401 }
      );
    }

    console.log("Creating meeting:", { title, startTime, endTime, participants });

    // Prepare attendees list (including organizer)
    const allAttendees = [...participants, session.user.email];
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
    const supabase = await createSupabaseServerClient();
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        duration,
        location: calendarEvent.hangoutLink || "",
        google_event_id: calendarEvent.id,
        organizer_id: session.user.id,
        participants: JSON.stringify(participants),
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Error saving meeting to database:", meetingError);
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
        participants: JSON.parse(meeting.participants),
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
