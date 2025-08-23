import { getServerSession } from "@/lib/auth-supabase";
import { findAvailableSlots } from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const availabilitySchema = z.object({
  emails: z.array(z.string().email()),
  duration: z.number().min(15).max(180).default(30),
  daysToCheck: z.number().min(1).max(14).default(7),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { emails, duration, daysToCheck } = availabilitySchema.parse(body);

    // Include current user's email in the check
    const allEmails = [...emails, session.user.email];

    console.log("Checking availability for:", allEmails);

    // Find available slots
    const slots = await findAvailableSlots({
      emails: allEmails,
      duration,
      daysToCheck,
    });

    return NextResponse.json({
      slots,
      participants: allEmails,
      duration,
      daysChecked: daysToCheck,
    });
  } catch (error) {
    console.error("Error checking availability:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
