// The calendar feed Google subscribes to. One event per scheduled job.
// No login — the long random token in the URL is what protects it, which is
// the only thing Google's "From URL" subscribe box can carry.
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Commas, semicolons and backslashes are separators in the calendar format,
// so they have to be escaped or the event silently breaks.
function esc(v) {
  return String(v ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// The format caps lines at 75 octets; longer ones continue on the next line
// starting with a single space.
function fold(line) {
  if (line.length <= 73) return line;
  const parts = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

function stamp(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function addressOf(j) {
  const line2 = [j.city, j.state].filter(Boolean).join(", ");
  return [j.street_address, line2, j.zip].filter(Boolean).join(" ").trim();
}

function customerOf(j) {
  return [j.first_name, j.last_name].filter(Boolean).join(" ");
}

export async function GET(request, { params }) {
  const { token } = await params;

  const bad = new Response("Not found", { status: 404 });
  if (!token || !UUID_RE.test(token.replace(/\.ics$/i, ""))) return bad;

  const clean = token.replace(/\.ics$/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return bad;

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("get_calendar_jobs", {
    p_token: clean,
  });

  if (error || !Array.isArray(data)) return bad;

  const origin = new URL(request.url).origin;
  const now = stamp(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//J.B. Pressure Washing//Ops App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:J.B. Pressure Washing — Jobs",
    "X-WR-CALDESC:Jobs scheduled in the ops app",
    // Hints to the calendar app about how often to come back. Google treats
    // these as a suggestion, not a promise.
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];

  for (const j of data) {
    const start = new Date(j.scheduled_at);
    if (Number.isNaN(start.getTime())) continue;
    const mins = Number(j.duration_minutes) || 120;
    const end = new Date(start.getTime() + mins * 60000);

    const who = customerOf(j);
    const title = [j.service_type, who].filter(Boolean).join(" — ") || "Job";
    const address = addressOf(j);

    const details = [
      j.price != null ? `Price: $${Number(j.price).toFixed(2)}` : null,
      j.phone ? `Phone: ${j.phone}` : null,
      j.company ? `Company: ${j.company}` : null,
      j.assigned_employee ? `Assigned: ${j.assigned_employee}` : null,
      j.status ? `Status: ${j.status}` : null,
      j.notes ? `\nNotes: ${j.notes}` : null,
      `\n${origin}/jobs/${j.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:job-${j.id}@jb-ops-app`),
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      fold(`SUMMARY:${esc(title)}`),
      ...(address ? [fold(`LOCATION:${esc(address)}`)] : []),
      fold(`DESCRIPTION:${esc(details)}`),
      fold(`URL:${origin}/jobs/${j.id}`),
      j.status === "Cancelled" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="jb-jobs.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
