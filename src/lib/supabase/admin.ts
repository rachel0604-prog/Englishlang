import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS — only ever call this from server
 * actions/route handlers gated by the admin PIN, never from client code.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("SUPABASE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL not set");
  }
  if (cached) return cached;

  cached = createClient(url, secretKey, {
    auth: { persistSession: false },
  });
  return cached;
}
