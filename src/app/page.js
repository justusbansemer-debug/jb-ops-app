import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard, Card, StatusPill } from "@/components/ui";
import { RevenueFlowChart, OutstandingInvoicesPanel } from "@/components/DashboardCharts";

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
      supabase.from("quotes").select("id, status, amount, date_sent"),
      supabase
        .from("invoices")
        .select("id, amount, amount_paid, invoice_date, customers(first_name, last_name, company)")
        .order("invoice_date", { ascending: true }),
    ]);

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // ---- YTD Sales: total invoiced this year, vs the same Jan 1–today
  // window last year (only shown when there's prior-year data to compare). ----
  const thisYearTotal = (invoices || [])
    .filter((i) => i.invoice_date && new Date(i.invoice_date).getFullYear() === currentYear)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const lastYearToDateTotal = (invoices || [])
    .filter((i) => {
      if (!i.invoice_date) return false;
      const d = new Date(i.invoice_date);
      if (d.getFullYear() !== currentYear - 1) return false;
      return d.getMonth() < currentMonth || (d.getMonth() === currentMonth && d.getDate() <= now.getDate());
    })
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const ytdChangePct =
    lastYearToDateTotal > 0 ? ((thisYearTotal - lastYearToDateTotal) / lastYearToDateTotal) * 100 : null;

  // ---- Close Ratio: accepted / (accepted + declined) quotes ----
  function closeRatio(filterFn) {
    const decided = (quotes || []).filter(
      (q) => filterFn(q) && (q.status === "Accepted" || q.status === "Declined")
    );
    if (decided.length === 0) return null;
    const accepted = decided.filter((q) => q.status === "Accepted").length;
    return (accepted / decided.length) * 100;
  }
  const closeMTD = closeRatio((q) => {
    if (!q.date_sent) return false;
    const d = new Date(q.date_sent);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const closeYTD = closeRatio((q) => {
    if (!q.date_sent) return false;
    return new Date(q.date_sent).getFullYear() === currentYear;
  });

  // ---- Outstanding invoices (unpaid/partial balance) ----
  const outstandingInvoices = (invoices || [])
    .map((i) => ({
      id: i.id,
      customerName: i.customers ? `${i.customers.first_name} ${i.customers.last_name}` : "Unknown",
      date: i.invoice_date,
      balance: Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0),
    }))
    .filter((i) => i.balance > 0);

  // ---- Revenue Flow: amount collected per day this month ----
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyTotals = new Array(daysInMonth).fill(0);
  (invoices || []).forEach((i) => {
    if (!i.invoice_date) return;
    const d = new Date(i.invoice_date);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      dailyTotals[d.getDate() - 1] += Number(i.amount_paid || 0);
    }
  });
  const revenuePoints = dailyTotals.map((value, idx) => ({ label: String(idx + 1), value }));
  const totalRevenueThisMonth = dailyTotals.reduce((a, b) => a + b, 0);

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthTotal = (invoices || [])
    .filter((i) => {
      if (!i.invoice_date) return false;
      const d = new Date(i.invoice_date);
      return d.getFullYear() === prevMonthDate.getFullYear() && d.getMonth() === prevMonthDate.getMonth();
    })
    .reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
  const revenueChangePct =
    prevMonthTotal > 0 ? ((totalRevenueThisMonth - prevMonthTotal) / prevMonthTotal) * 100 : null;

  const monthLabel = now.toLocaleDateString("en-US", { month: "long" });
  const rangeStartLabel = `1 ${now.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  const rangeEndLabel = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  const pendingQuotesValue = (quotes || [])
    .filter((q) => q.status === "Pending")
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, Justus 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s how the business looks today.</p>
        </div>
        <Link
          href="/today"
          className="shrink-0 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap"
        >
          Today&apos;s Jobs →
        </Link>
      </div>

      {!configured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4">
          This app isn&apos;t connected to a database yet. Copy <code>.env.local.example</code> to{" "}
          <code>.env.local</code> and add your Supabase project details to see real numbers here.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Card title="YTD Sales">
          <div className="text-3xl font-bold">${thisYearTotal.toFixed(2)}</div>
          {ytdChangePct !== null ? (
            <div className={`text-sm font-semibold mt-2 ${ytdChangePct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {ytdChangePct >= 0 ? "▲" : "▼"} {Math.abs(ytdChangePct).toFixed(0)}% vs last year
            </div>
          ) : (
            <div className="text-sm text-slate-400 mt-2">No prior-year data to compare yet</div>
          )}
        </Card>

        <Card title="Close Ratio">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">MTD</span>
              <span className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-lg">
                {closeMTD !== null ? `${closeMTD.toFixed(0)}%` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">YTD</span>
              <span className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-lg">
                {closeYTD !== null ? `${closeYTD.toFixed(0)}%` : "—"}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Outstanding Invoices" className="lg:row-span-2">
          <OutstandingInvoicesPanel invoices={outstandingInvoices} />
        </Card>

        <Card title="Revenue Flow" className="lg:col-span-2">
          <div className="text-3xl font-bold">${totalRevenueThisMonth.toFixed(2)}</div>
          <div className="text-slate-400 text-sm mb-4">Total revenue collected — {monthLabel}</div>
          {revenueChangePct !== null && (
            <div className={`text-sm font-semibold mb-4 ${revenueChangePct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {revenueChangePct >= 0 ? "+" : ""}
              {revenueChangePct.toFixed(0)}% vs last month
            </div>
          )}
          <RevenueFlowChart points={revenuePoints} startLabel={rangeStartLabel} endLabel={rangeEndLabel} />
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Customers" value={customers?.length ?? 0} />
        <StatCard label="Pending Quote Value" value={`$${pendingQuotesValue.toFixed(2)}`} />
      </div>

      <Card
        title="Upcoming Jobs"
        action={
          <Link href="/jobs" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
            View all jobs
          </Link>
        }
      >
        {(!jobs || jobs.length === 0) && <p className="text-slate-400 text-sm">No jobs scheduled yet.</p>}
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
