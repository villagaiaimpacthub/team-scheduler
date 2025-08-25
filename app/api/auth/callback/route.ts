import { storeGoogleTokens } from "@/lib/auth-supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();

    // Exchange the code for a session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (!authError && authData.session) {
      const { user, session } = authData;

      // Extract Google tokens from the provider token
      const googleTokens = session.provider_token;
      const googleRefreshToken = session.provider_refresh_token;

      if (googleTokens) {
        try {
          // Store Google OAuth tokens for calendar access
          await storeGoogleTokens({
            userId: user.id,
            accessToken: googleTokens,
            refreshToken: googleRefreshToken || undefined,
            expiresAt: session.expires_at,
            scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
          });
        } catch (error) {
          console.error("Error storing Google tokens:", error);
          // Continue with login even if token storage fails
        }
      }

      // Ensure a row exists in users table for our getServerSession logic
      try {
        const email = user.email || '';
        const domain = email.includes('@') ? email.split('@')[1] : null;
        await supabase.from('users').upsert({
          id: user.id,
          email,
          name: (user.user_metadata as any)?.full_name || user.user_metadata?.name || null,
          image_url: (user.user_metadata as any)?.avatar_url || null,
          domain,
        }, { onConflict: 'id' });
      } catch (e) {
        console.error('Upsert users row failed', e);
      }

      // Redirect to home page with set-cookie preserved
      const res = NextResponse.redirect(`${origin}/`)
      // pass through cookies already set via supabase SSR helpers
      return res
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
