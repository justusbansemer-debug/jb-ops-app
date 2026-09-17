// This file runs on the server before every page loads. It checks whether
// you're logged in, and sends you to /login if not. (Next.js calls this a
// "Proxy" — in older Next.js versions it was called "middleware".)
import { updateSession } from "@/lib/supabase/proxySession";

export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  // Run on every page except static assets (images, CSS, etc.) — those
  // don't need a login check and skipping them keeps the site fast.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
