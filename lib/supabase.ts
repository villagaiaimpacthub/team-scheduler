import { Database } from "@/types/database.types";
import { createBrowserClient } from "@supabase/ssr";

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client-side Supabase client with SSR support
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
