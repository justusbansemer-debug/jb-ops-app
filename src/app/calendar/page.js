import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";

export const dynamic = "force-dynamic";

function pad(n) {
  return String(n).padStart(2, "0");
}

export default async function CalendarPage({ searchParams }) {
  const sp = await searchParams;
  const raw = String(sp?.m || "");
  const now = new Date();

  const valid = /^\d{4}-\d{2}$/.test(raw);
  const year = valid ? Number(raw.slice(0, 4)) : now.getFullYear();
  const month = valid ? Number(raw.slice(5, 7)) : now.getMonth() + 1;

  // Pull a week either side of the month so days bleeding in from the
  // neighbouring months still show their jobs, and so a timezone shift can
  // never drop one off the edge.
  const from = new Date(Date.UTC(year, month - 1, 1));
  from.setUTCDate(from.getUTCDate() - 7);
  const to = new Date(Date.UTC(year, month, 1));
  to.setUTCDate(to.getUTCDate() + 7);

  const supabase = await createClient();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, service_type, scheduled_at, duration_minutes, status, price, customers(first_name, last_name)"
    )
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", from.toISOString())
    .lt("scheduled_at", to.toISOString())
    .order("scheduled_at", { ascending: true });

  const prev = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const href = (d) => `/calendar?m=${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-red-600 text-sm">
          Could not load the calendar — {error.message}
        </p>
      )}

      <CalendarView
        year={year}
        month={month}
        jobs={jobs || []}
        prevHref={href(prev)}
        nextHref={href(next)}
      />
    </div>
  );
}
