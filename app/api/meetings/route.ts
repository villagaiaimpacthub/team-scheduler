import { getServerSession } from "@/lib/auth-supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

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
      console.error("Error fetching meetings:", error);
      return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
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
        participants: JSON.parse(meeting.participants),
        googleEventId: meeting.google_event_id,
        createdAt: meeting.created_at,
      })) || [];

    return NextResponse.json({ meetings: formattedMeetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
