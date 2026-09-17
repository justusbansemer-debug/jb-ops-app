import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard, Card, StatusPill } from "@/components/ui";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: jobs }, { data: quotes }, { data: invoices }] =
    await Promise.all([
      supabase.from("customers").select("id"),
      supabase
        .from("jobs")
        .select("*, customers(first_name, last_name)")
        .order("scheduled_at", { ascending: true })
        .limit(5),
      supabase.from("quotes").select("id, status, amount"),
      supabase.from("invoices").select("amount, amount_paid"),
    ]);

  const pendingQuotesValue = (quotes || [])
    .filter((q) => q.status === "Pending")
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  const outstandingBalance = (invoices || []).reduce(
    (sum, i) => sum + Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0),
    0
  );

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Here&apos;s how the business looks today.</p>
      </div>

      {!configured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4">
          This app isn&apos;t connected to a database yet. Copy <code>.env.local.example</code> to{" "}
          <code>.env.local</code> and add your Supabase project details to see real numbers here.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Customers" value={customers?.length ?? 0} />
        <StatCard label="Upcoming/Recent Jobs" value={jobs?.length ?? 0} />
        <StatCard label="Pending Quote Value" value={`$${pendingQuotesValue.toFixed(2)}`} />
        <StatCard label="Outstanding Balance" value={`$${outstandingBalance.toFixed(2)}`} />
      </div>

      <Card
        title="Upcoming Jobs"
        action={
          <Link href="/jobs" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
            View all jobs
          </Link>
        }
      >
        {(!jobs || jobs.length === 0) && (
          <p className="text-slate-400 text-sm">No jobs scheduled yet.</p>
        )}
        {jobs && jobs.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {jobs.map((j) => (
              <li key={j.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">
                    {j.customers ? `${j.customers.first_name} ${j.customers.last_name}` : "—"}
                  </div>
                  <div className="text-slate-400 text-xs">{j.service_type}</div>
                </div>
                <StatusPill status={j.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
