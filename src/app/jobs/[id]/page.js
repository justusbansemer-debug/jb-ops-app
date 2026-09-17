import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, StatusPill } from "@/components/ui";

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
