import { User } from "@/types/database.types";

import { createSupabaseServerClient } from "./supabase-server";

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

  // Get the authenticated user from Supabase Auth
  let {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Fallback to session if getUser is null (some hosting contexts)
  if (!authUser) {
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
    scope: scope || "https://www.googleapis.com/auth/calendar",
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

    return {
      access_token: refreshedTokens.access_token,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing Google access token:", error);
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
