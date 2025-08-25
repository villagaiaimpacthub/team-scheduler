import { User } from "@/types/database.types";

import { createSupabaseServerClient } from "./supabase-server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export interface AuthSession {
  user: User & {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
  expires: string;
}

/**
 * Get the current authenticated user session
 * Replacement for NextAuth's getServerSession
 */
export async function getServerSession(): Promise<AuthSession | null> {
  const supabase = await createSupabaseServerClient();

  // Try to materialize session from sb-* cookies if getUser() is null
  const primeSessionFromCookies = async () => {
    try {
      const cookieStore = await cookies();
      const refMatch = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").match(/https?:\/\/([a-z0-9]+)\.supabase\./i);
      const projectRef = refMatch ? refMatch[1] : undefined;
      if (!projectRef) return;
      const base = `sb-${projectRef}-auth-token`;
      const c0 = cookieStore.get(`${base}.0`)?.value;
      const c1 = cookieStore.get(`${base}.1`)?.value;
      // Supabase splits long cookie values into .0 and .1 and prefixes first part with 'base64-'
      const part0 = c0 ? (c0.startsWith('base64-') ? c0.slice(7) : c0) : '';
      const part1 = c1 || '';
      const raw = (part0 + part1) || cookieStore.get(base)?.value || '';
      if (!raw) return;
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      const json = JSON.parse(decoded) as any;
      const access_token = json?.access_token as string | undefined;
      const refresh_token = json?.refresh_token as string | undefined;
      if (access_token) {
        // Use a plain client for direct getUser(access_token)
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        const plain = createClient(url, anon);
        const { data: direct } = await plain.auth.getUser(access_token);
        if (direct?.user) {
          return { user: direct.user } as any;
        }
      }
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        const { data: sess } = await supabase.auth.getSession();
        if (sess?.session?.user) return { user: sess.session.user } as any;
      }
    } catch {}
  };

  // Get the authenticated user from Supabase Auth
  let {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Fallback to session if getUser is null (some hosting contexts)
  if (!authUser) {
    const primed = await primeSessionFromCookies();
    if (primed?.user) authUser = primed.user as any;
    const { data: sessionData } = await supabase.auth.getSession();
    authUser = (sessionData?.session as any)?.user || null;
    if (!authUser) {
      return null;
    }
  }

  // Get the user profile from our users table
  let { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  // If the profile doesn't exist yet (first login), create it on-the-fly
  if (profileError || !userProfile) {
    const email = authUser.email || "";
    const domain = email.includes("@") ? email.split("@")[1] : null;
    await supabase
      .from("users")
      .upsert({
        id: authUser.id,
        email,
        name: (authUser.user_metadata as any)?.full_name || (authUser.user_metadata as any)?.name || null,
        image_url: (authUser.user_metadata as any)?.avatar_url || null,
        domain: domain || null,
      }, { onConflict: "id" });

    const reselect = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    userProfile = reselect.data as any;
    if (!userProfile) {
      return null;
    }
  }

  // Get Google tokens for calendar access
  const { data: googleTokens } = await supabase
    .from("google_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", authUser.id)
    .single();

  // Combine user profile with auth info and Google tokens
  const session: AuthSession = {
    user: {
      ...userProfile,
      access_token: googleTokens?.access_token || undefined,
      refresh_token: googleTokens?.refresh_token || undefined,
      expires_at: googleTokens?.expires_at ? new Date(googleTokens.expires_at).getTime() / 1000 : undefined,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  };

  return session;
}

/**
 * Get team members from the same domain as the current user
 */
export async function getTeamMembers(): Promise<User[]> {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  // Use the stored function to get team members
  const { data, error } = await supabase.rpc("get_team_members", {
    user_email: session.user.email,
  });

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }

  return data || [];
}

/**
 * Store or update Google OAuth tokens for a user
 */
export async function storeGoogleTokens({
  userId,
  accessToken,
  refreshToken,
  expiresAt,
  scope,
}: {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const tokenData = {
    user_id: userId,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
    token_type: "Bearer",
    scope: scope || "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
  };

  // Upsert the tokens (insert or update if exists)
  const { error } = await supabase.from("google_tokens").upsert(tokenData, { onConflict: "user_id" });

  if (error) {
    console.error("Error storing Google tokens:", error);
    throw new Error("Failed to store Google tokens");
  }
}

/**
 * Refresh Google access token using refresh token
 */
export async function refreshGoogleAccessToken(userId: string): Promise<{
  access_token: string;
  expires_at: number;
} | null> {
  const supabase = await createSupabaseServerClient();

  // Get current tokens
  const { data: tokenData, error } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData?.refresh_token) {
    console.error("No refresh token available for user:", userId);
    return null;
  }

  try {
    // Refresh the access token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: tokenData.refresh_token,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Token refresh failed:", {
        status: response.status,
        error: refreshedTokens.error,
        description: refreshedTokens.error_description,
        userId
      });
      
      // If refresh token is invalid, user needs to re-authenticate
      if (refreshedTokens.error === 'invalid_grant' || response.status === 400) {
        console.error("Refresh token invalid for user", userId, "- user needs to re-authenticate");
        // Delete invalid tokens to force re-auth
        await supabase.from("google_tokens").delete().eq("user_id", userId);
      }
      
      throw new Error(refreshedTokens.error || "Token refresh failed");
    }

    const expiresAt = Date.now() / 1000 + refreshedTokens.expires_in;

    // Update tokens in database
    await storeGoogleTokens({
      userId,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token || tokenData.refresh_token,
      expiresAt,
    });

    console.log("Successfully refreshed token for user:", userId);
    return {
      access_token: refreshedTokens.access_token,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing Google access token for user", userId, ":", error);
    return null;
  }
}

/**
 * Get a valid Google access token for the current user
 * Automatically refreshes if expired
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const session = await getServerSession();

  if (!session?.user) {
    return null;
  }

  const { user } = session;

  // Check if we have a valid access token
  if (user.access_token && user.expires_at) {
    const now = Date.now() / 1000;

    // If token is still valid (with 5 minute buffer), return it
    if (user.expires_at > now + 300) {
      return user.access_token;
    }

    // Token is expired or close to expiring, refresh it
    const refreshedToken = await refreshGoogleAccessToken(user.id);
    if (refreshedToken) {
      return refreshedToken.access_token;
    }
  }

  return null;
}

/**
 * Get a valid Google access token for a specific user ID
 * Automatically refreshes if expired - for use in API routes
 */
export async function getGoogleAccessTokenForUser(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  // Get current token data
  const { data: tokenData, error } = await supabase
    .from("google_tokens")
    .select("access_token, expires_at, refresh_token")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData) {
    console.log("No token data found for user:", userId);
    return null;
  }

  // Check if current token is valid
  if (tokenData.access_token && tokenData.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date(tokenData.expires_at).getTime() / 1000;

    // If token is still valid (with 5 minute buffer), return it
    if (expiresAt > now + 300) {
      return tokenData.access_token;
    }

    // Token is expired or close to expiring, refresh it
    console.log("Token expired for user", userId, "- attempting refresh");
    const refreshedToken = await refreshGoogleAccessToken(userId);
    if (refreshedToken) {
      console.log("Token refreshed successfully for user:", userId);
      return refreshedToken.access_token;
    } else {
      console.error("Failed to refresh token for user:", userId);
    }
  }

  return null;
}
