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
            refreshToken: googleRefreshToken,
            expiresAt: session.expires_at,
            scope: "https://www.googleapis.com/auth/calendar",
          });
        } catch (error) {
          console.error("Error storing Google tokens:", error);
          // Continue with login even if token storage fails
        }
      }

      // Redirect to home page
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
