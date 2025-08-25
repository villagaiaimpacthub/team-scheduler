import { getServerSession } from "@/lib/auth-supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = params;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Delete teammate failed:', error);
      return NextResponse.json({ error: 'Failed to delete teammate' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}




