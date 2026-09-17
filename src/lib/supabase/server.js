// A Supabase client for use in Server Components, Server Actions, and pages.
// Unlike the old lib/supabaseClient.js, this one reads the visitor's login
// cookie on every request — so once someone signs in, their requests are
// treated as "logged in" and the database's security rules let them through.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a place that can't set cookies (a plain Server
          // Component render) — safe to ignore because proxy.js (below)
          // already keeps the session cookie refreshed on every request.
        }
      },
    },
  });
}
