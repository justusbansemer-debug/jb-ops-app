import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import CopyField from "@/components/CopyField";

export const dynamic = "force-dynamic";

export default async function CalendarSettingsPage() {
  const supabase = await createClient();
  const { data: biz, error } = await supabase
    .from("business_settings")
    .select("calendar_token")
    .eq("id", 1)
    .maybeSingle();

  const h = await headers();
  const host = h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const feedUrl = biz?.calendar_token
    ? `${proto}://${host}/api/calendar/${biz.calendar_token}.ics`
    : null;

  return (
    <div className="space-y-6">
      <Link href="/settings" className="text-sm text-slate-500">
        ← Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Google Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">
          Subscribe once and every job you schedule shows up on your calendar
          from then on — no copying anything over.
        </p>
      </div>

      {(error || !feedUrl) && (
        <p className="text-red-600 text-sm">
          Could not build your calendar link — run supabase/calendar.sql in
          Supabase first.
        </p>
      )}

      {feedUrl && (
        <>
          <Card title="Your private calendar link">
            <CopyField value={feedUrl} />
            <p className="text-xs text-slate-500 mt-3">
              Treat this like a password. Anyone who has it can see your job
              schedule, and it never expires on its own.
            </p>
          </Card>

          <Card title="How to subscribe">
            <ol className="text-sm text-slate-700 space-y-3 list-decimal pl-5">
              <li>Copy the link above.</li>
              <li>
                On a computer, open{" "}
                <a
                  href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-orange-600 hover:underline"
                >
                  Google Calendar → Add by URL
                </a>
                . (This one has to be done on a computer — the phone app
                can&apos;t add a calendar by link.)
              </li>
              <li>
                Paste the link in and click <strong>Add calendar</strong>.
              </li>
              <li>
                That&apos;s it. It shows up on your phone too, under the same
                Google account.
              </li>
            </ol>
            <p className="text-sm text-slate-500 mt-4">
              Google decides how often it checks this link for changes —
              usually within the hour, sometimes slower. For a job you booked
              for this afternoon, use the{" "}
              <strong>Add to Google Calendar</strong> button on the job itself
              and it lands right away.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
