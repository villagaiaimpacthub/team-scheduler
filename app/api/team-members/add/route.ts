import { getServerSession } from "@/lib/auth-supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { email, name } = await request.json();
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const companyDomain = process.env.COMPANY_DOMAIN;
    if (companyDomain && !email.toLowerCase().endsWith(`@${companyDomain}`)) {
      return NextResponse.json({ error: 'Email not in company domain' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const domain = email.split('@')[1];

    const { error } = await supabase
      .from('users')
      .upsert({
        id: crypto.randomUUID(),
        email,
        name: name || email.split('@')[0],
        domain,
      }, { onConflict: 'email' });

    if (error) {
      console.error('Add teammate failed:', error);
      return NextResponse.json({ error: 'Failed to add teammate' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}



