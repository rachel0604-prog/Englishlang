import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Read-only anon-key client for Server Components / route handlers.
 * Returns null when Supabase env vars aren't set yet, so pages can render
 * an empty state instead of crashing before the project is connected.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (cached) return cached;

  cached = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return cached;
}
