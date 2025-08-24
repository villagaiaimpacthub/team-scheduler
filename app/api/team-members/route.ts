import { getServerSession, getTeamMembers } from "@/lib/auth-supabase";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const debug = request.nextUrl.searchParams.get('debug') === '1'
    const cookieStore = await cookies()
    const cookieKeys = cookieStore.getAll().map((c) => c.name).filter((n) => n.startsWith('sb-'))

    if (!session?.user?.email) {
      const body: any = { error: "Not authenticated" }
      if (debug) body.debug = { cookieKeys, note: 'No session user email' }
      return NextResponse.json(body, { status: 401 });
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
      ...(debug ? { debug: { cookieKeys } } : {}),
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
