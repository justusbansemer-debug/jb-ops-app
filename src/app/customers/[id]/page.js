import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, StatusPill } from "@/components/ui";

export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: jobs }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase.from("jobs").select("*").eq("customer_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("quotes").select("*").eq("customer_id", id).order("date_sent", { ascending: false }),
    supabase.from("invoices").select("*").eq("customer_id", id).order("invoice_date", { ascending: false }),
  ]);

  if (!customer) notFound();

  const jobList = jobs || [];
  const quoteList = quotes || [];
  const invoiceList = invoices || [];

  const totalInvoiced = invoiceList.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalPaid = invoiceList.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
  const outstanding = Math.max(totalInvoiced - totalPaid, 0);
  const pendingQuoteValue = quoteList
    .filter((q) => q.status === "Pending")
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/customers" className="text-sm text-slate-500 hover:underline">
            ← All Customers
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            {customer.first_name} {customer.last_name}
          </h1>
          {customer.company && <p className="text-slate-500 text-sm mt-1">{customer.company}</p>}
        </div>
        <Link
          href={`/customers/${customer.id}/edit`}
          className="text-sm font-medium text-orange-600 hover:underline shrink-0"
        >
          Edit Customer
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Total Invoiced</div>
          <div className="text-xl font-bold mt-1">${totalInvoiced.toFixed(2)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Total Paid</div>
          <div className="text-xl font-bold mt-1">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Outstanding</div>
          <div className="text-xl font-bold mt-1">${outstanding.toFixed(2)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Pending Quotes</div>
          <div className="text-xl font-bold mt-1">${pendingQuoteValue.toFixed(2)}</div>
        </div>
      </div>

      <Card title="Contact Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Phone</div>
            <div className="mt-0.5">{customer.phone || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Email</div>
            <div className="mt-0.5">{customer.email || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Address</div>
            <div className="mt-0.5">
              {customer.street_address || "—"}
              {(customer.city || customer.state || customer.zip) && (
                <div>{[customer.city, customer.state, customer.zip].filter(Boolean).join(", ")}</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Referral Source</div>
            <div className="mt-0.5">{customer.referral_source || "—"}</div>
          </div>
          {customer.notes && (
            <div className="sm:col-span-2">
              <div className="text-slate-400 text-xs">Notes</div>
              <div className="mt-0.5">{customer.notes}</div>
            </div>
          )}
        </div>
      </Card>

      <Card title={`Jobs (${jobList.length})`}>
        {jobList.length === 0 ? (
          <p className="text-slate-400 text-sm">No jobs for this customer yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {jobList.map((j) => (
              <li key={j.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold">{j.service_type}</div>
                  <div className="text-xs text-slate-400">
                    {j.scheduled_at ? new Date(j.scheduled_at).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusPill status={j.status} />
                  <Link href={`/jobs/${j.id}/edit`} className="text-slate-400 hover:text-orange-600 text-xs font-medium">
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Quotes (${quoteList.length})`}>
        {quoteList.length === 0 ? (
          <p className="text-slate-400 text-sm">No quotes for this customer yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {quoteList.map((q) => (
              <li key={q.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold">{q.service_type}</div>
                  <div className="text-xs text-slate-400">{q.date_sent || "—"}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="font-semibold">{q.amount != null ? `$${Number(q.amount).toFixed(2)}` : "—"}</div>
                  <StatusPill status={q.status} />
                  <Link href={`/quotes/${q.id}/edit`} className="text-slate-400 hover:text-orange-600 text-xs font-medium">
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Invoices (${invoiceList.length})`}>
        {invoiceList.length === 0 ? (
          <p className="text-slate-400 text-sm">No invoices for this customer yet.</p>
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
