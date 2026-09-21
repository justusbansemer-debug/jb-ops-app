import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, StatusPill } from "@/components/ui";

// A one-tap "put this on my Google Calendar right now" link, for when the
// subscribed feed hasn't caught up yet.
function googleCalendarUrl(job, customer, origin) {
  if (!job.scheduled_at) return null;
  const start = new Date(job.scheduled_at);
  if (Number.isNaN(start.getTime())) return null;

  const mins = Number(job.duration_minutes) || 120;
  const end = new Date(start.getTime() + mins * 60000);
  const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const who = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
    : "";
  const title = [job.service_type, who].filter(Boolean).join(" — ") || "Job";

  const address = customer
    ? [
        customer.street_address,
        [customer.city, customer.state].filter(Boolean).join(", "),
        customer.zip,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const details = [
    job.price != null ? `Price: $${Number(job.price).toFixed(2)}` : null,
    customer?.phone ? `Phone: ${customer.phone}` : null,
    job.assigned_employee ? `Assigned: ${job.assigned_employee}` : null,
    job.notes ? `\nNotes: ${job.notes}` : null,
    origin ? `\n${origin}/jobs/${job.id}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
  });
  if (address) p.set("location", address);

  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export default async function JobDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, customers(id, first_name, last_name, company, phone, email, street_address, city, state, zip)")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("job_id", id)
    .order("invoice_date", { ascending: false });

  const invoiceList = invoices || [];
  const customer = job.customers;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") || "https"}://${h.get("host") || ""}`;
  const calendarUrl = googleCalendarUrl(job, customer, origin);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/jobs" className="text-sm text-slate-500 hover:underline">
            ← All Jobs
          </Link>
          <h1 className="text-2xl font-bold mt-1">{job.service_type}</h1>
          <div className="mt-2">
            <StatusPill status={job.status} />
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}/edit`}
          className="text-sm font-medium text-orange-600 hover:underline shrink-0"
        >
          Edit Job
        </Link>
      </div>

      <Card title="Customer">
        {customer ? (
          <div className="space-y-1 text-sm">
            <Link
              href={`/customers/${customer.id}`}
              className="font-semibold text-base hover:text-orange-600"
            >
              {customer.first_name} {customer.last_name}
            </Link>
            {customer.company && <div className="text-slate-500">{customer.company}</div>}
            <div className="text-slate-600 pt-2">{customer.phone || "—"}</div>
            <div className="text-slate-600">{customer.email || "—"}</div>
            <div className="text-slate-600">
              {customer.street_address ? `${customer.street_address}, ` : ""}
              {[customer.city, customer.state, customer.zip].filter(Boolean).join(", ") || (!customer.street_address ? "—" : "")}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No customer linked to this job.</p>
        )}
      </Card>

      <Card title="Job Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Scheduled</div>
            <div className="mt-0.5">
              {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Length</div>
            <div className="mt-0.5">
              {job.duration_minutes
                ? `${(Number(job.duration_minutes) / 60).toFixed(2).replace(/\.?0+$/, "")} hr`
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Assigned Employee</div>
            <div className="mt-0.5">{job.assigned_employee || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Price</div>
            <div className="mt-0.5">{job.price != null ? `$${Number(job.price).toFixed(2)}` : "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Status</div>
            <div className="mt-0.5">
              <StatusPill status={job.status} />
            </div>
          </div>
          {job.notes && (
            <div className="sm:col-span-2">
              <div className="text-slate-400 text-xs">Notes</div>
              <div className="mt-0.5">{job.notes}</div>
            </div>
          )}
        </div>

        {calendarUrl && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg"
            >
              Add to Google Calendar
            </a>
            <p className="text-xs text-slate-400 mt-2">
              For right now. Jobs also arrive on their own if you&apos;ve
              subscribed to your calendar link in Settings.
            </p>
          </div>
        )}
      </Card>

      <Card title={`Invoices (${invoiceList.length})`}>
        {invoiceList.length === 0 ? (
          <p className="text-slate-400 text-sm">No invoices for this job yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invoiceList.map((i) => {
              const balance = Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0);
              const status = balance <= 0 ? "Paid" : Number(i.amount_paid || 0) > 0 ? "Partial" : "Unpaid";
              return (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-semibold">{i.invoice_date || "—"}</div>
                    <div className="text-xs text-slate-400">Balance: ${balance.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-semibold">${Number(i.amount || 0).toFixed(2)}</div>
                    <StatusPill status={status} />
                    <Link
                      href={`/invoices/${i.id}/edit`}
                      className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
