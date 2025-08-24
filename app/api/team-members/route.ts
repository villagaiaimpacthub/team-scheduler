import { Database } from "@/types/database.types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const debug = request.nextUrl.searchParams.get('debug') === '1'
    const cookieStore = await cookies()
    const cookieKeys = cookieStore.getAll().map((c) => c.name).filter((n) => n.startsWith('sb-'))

    // Create a request-bound Supabase server client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user?.email || error) {
      const body: any = { error: "Not authenticated" }
      if (debug) body.debug = { cookieKeys, note: 'No session user email (request-bound client)' }
      return NextResponse.json(body, { status: 401 })
    }

    // Fetch teammates via RPC using the same request-bound client
    const { data: teammates, error: tmError } = await supabase.rpc('get_team_members', {
      user_email: user.email,
    })
    if (tmError) {
      return NextResponse.json({ error: 'Failed to load team members' }, { status: 500 })
    }

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
        email: user.email,
        domain: (user as any).domain,
      },
      companyDomain,
      ...(debug ? { debug: { cookieKeys } } : {}),
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
