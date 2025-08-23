import { getServerSession, getTeamMembers } from "@/lib/auth-supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get team members using the utility function
    const teammates = await getTeamMembers();

    // Also check if company domain filter is set
    const companyDomain = process.env.COMPANY_DOMAIN;
    const filteredTeammates = companyDomain
      ? teammates.filter((member) => member.email?.endsWith(`@${companyDomain}`))
      : teammates;

    return NextResponse.json({
      teammates: filteredTeammates.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image_url,
      })),
      currentUser: {
        email: session.user.email,
        domain: session.user.domain,
      },
      companyDomain,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
