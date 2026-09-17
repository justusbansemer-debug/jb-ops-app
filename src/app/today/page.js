import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, StatusPill } from "@/components/ui";
import JobStatusButtons from "@/components/JobStatusButtons";

async function updateJobStatus(id, status) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);

  if (error) {
    console.error("Failed to update job status:", error.message);
    return;
  }

  revalidatePath("/today");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/");
}

function mapsUrlFor(customer) {
  const parts = [customer.street_address, customer.city, customer.state, customer.zip].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

function JobCard({ job }) {
  const customer = job.customers;
  const maps = customer ? mapsUrlFor(customer) : null;

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-400 font-medium">
            {job.scheduled_at
              ? new Date(job.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : "No time set"}
          </div>
          <Link href={`/jobs/${job.id}`} className="font-semibold text-base hover:text-orange-600">
            {customer ? `${customer.first_name} ${customer.last_name}` : "—"}
          </Link>
          <div className="text-sm text-slate-500">{job.service_type}</div>
        </div>
        <StatusPill status={job.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {customer?.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-2 rounded-lg"
          >
            📞 Call
          </a>
        )}
        {maps && (
          <a
            href={maps}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-2 rounded-lg"
          >
            📍 Directions
          </a>
        )}
        <JobStatusButtons action={updateJobStatus} id={job.id} status={job.status} />
        <Link
          href={`/jobs/${job.id}`}
          className="text-xs font-medium text-slate-400 hover:text-orange-600 px-1 py-2"
        >
          Details
        </Link>
      </div>
    </div>
  );
}

export default async function TodayPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "*, customers(id, first_name, last_name, company, phone, street_address, city, state, zip)"
    )
    .in("status", ["Scheduled", "In Progress"])
    .order("scheduled_at", { ascending: true });

  const list = jobs || [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysJobs = list.filter((j) => {
    if (!j.scheduled_at) return false;
    const d = new Date(j.scheduled_at);
    return d >= todayStart && d <= todayEnd;
  });

  const upcomingJobs = list.filter((j) => {
    if (!j.scheduled_at) return true;
    const d = new Date(j.scheduled_at);
    return d > todayEnd;
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-1">Today</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} — built for the
          field: tap to call, get directions, or update a job&apos;s status.
        </p>
      </div>

      <Card title={`Today's Jobs (${todaysJobs.length})`}>
        {todaysJobs.length === 0 ? (
          <p className="text-slate-400 text-sm">Nothing scheduled for today.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaysJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        )}
      </Card>

      {upcomingJobs.length > 0 && (
        <Card title={`Upcoming (${upcomingJobs.length})`}>
          <div className="divide-y divide-slate-100">
            {upcomingJobs.slice(0, 10).map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </Card>
      )}

      {todaysJobs.length === 0 && upcomingJobs.length === 0 && (
        <p className="text-slate-400 text-sm">
          No upcoming jobs at all — head to{" "}
          <Link href="/jobs" className="text-orange-600 hover:underline">
            Jobs
          </Link>{" "}
          to schedule one.
        </p>
      )}
    </div>
  );
}
