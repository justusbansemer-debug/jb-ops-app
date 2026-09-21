import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, StatusPill } from "@/components/ui";
import {
  SalesPanel,
  CloseRatioPanel,
  RevenuePanel,
  OutstandingInvoicesPanel,
} from "@/components/DashboardCharts";

// --- Recent Activity: what customers did with the estimate links you sent ---
const ACTIVITY = {
  viewed: { verb: "opened your estimate", dot: "bg-blue-500" },
  accepted: { verb: "accepted your estimate", dot: "bg-green-600" },
  declined: { verb: "declined your estimate", dot: "bg-slate-400" },
  change_requested: { verb: "asked for a change", dot: "bg-amber-500" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeAgo(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pctChange(now, before) {
  if (!before || before <= 0) return null;
  return ((now - before) / before) * 100;
}

// The one-liner under the Revenue Flow number.
function insightFor(pct, total, label) {
  if (total <= 0) {
    return {
      headline: "Nothing collected yet",
      insight: `No payments recorded for ${label.toLowerCase()} so far. Mark invoices paid and this fills in.`,
    };
  }
  if (pct === null) {
    return {
      headline: "Revenue coming in",
      insight: `${label} brought in money — once there's an earlier period to compare, you'll see the trend here.`,
    };
  }
  if (pct >= 20) {
    return {
      headline: "Strong growth!",
      insight: `Revenue is up ${pct.toFixed(0)}% compared with the period before.`,
    };
  }
  if (pct >= 0) {
    return {
      headline: "Holding steady",
      insight: `Revenue is up ${pct.toFixed(0)}% on the period before — steady as she goes.`,
    };
  }
  return {
    headline: "Down on last period",
    insight: `Revenue is ${Math.abs(pct).toFixed(0)}% lower than the period before. Worth a look at estimates still pending.`,
  };
}

const QUICK_ACTIONS = [
  { href: "/quotes#add", label: "New estimate", sub: "Price a job" },
  { href: "/today", label: "Today's jobs", sub: "What's on deck" },
  { href: "/customers#add", label: "New customer", sub: "Add a contact" },
  { href: "/invoices#add", label: "New invoice", sub: "Get paid" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: customers },
    { data: jobs },
    { data: quotes },
    { data: invoices },
    { data: activity },
  ] = await Promise.all([
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
    // What customers have done with the estimate links you sent them.
    // Missing table (migration not run yet) -> null, handled below.
    supabase
      .from("quote_events")
      .select("*, quotes(id, service_type, customers(first_name, last_name))")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const list = invoices || [];

  // --- small helpers over the invoice list -------------------------------
  const sumBilled = (fn) =>
    list.filter((i) => i.invoice_date && fn(new Date(i.invoice_date))).reduce((s, i) => s + Number(i.amount || 0), 0);
  const sumPaid = (fn) =>
    list
      .filter((i) => i.invoice_date && fn(new Date(i.invoice_date)))
      .reduce((s, i) => s + Number(i.amount_paid || 0), 0);

  const inYear = (y) => (d) => d.getFullYear() === y;
  const inMonth = (y, m) => (d) => d.getFullYear() === y && d.getMonth() === m;
  const toDate = (y) => (d) =>
    d.getFullYear() === y &&
    (d.getMonth() < currentMonth || (d.getMonth() === currentMonth && d.getDate() <= now.getDate()));

  const monthsBilled = (y) => MONTHS.map((label, m) => ({ label, value: sumBilled(inMonth(y, m)) }));
  const monthsPaid = (y) => MONTHS.map((label, m) => ({ label, value: sumPaid(inMonth(y, m)) }));
  const daysPaid = (y, m) => {
    const days = new Date(y, m + 1, 0).getDate();
    const totals = new Array(days).fill(0);
    list.forEach((i) => {
      if (!i.invoice_date) return;
      const d = new Date(i.invoice_date);
      if (d.getFullYear() === y && d.getMonth() === m) totals[d.getDate() - 1] += Number(i.amount_paid || 0);
    });
    return totals.map((value, idx) => ({ label: String(idx + 1), value }));
  };

  // --- Sales panel (invoiced) --------------------------------------------
  const ytdTotal = sumBilled(inYear(currentYear));
  const lastYearToDate = sumBilled(toDate(currentYear - 1));
  const thisMonthBilled = sumBilled(inMonth(currentYear, currentMonth));
  const prevMonthRef = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthBilled = sumBilled(inMonth(prevMonthRef.getFullYear(), prevMonthRef.getMonth()));
  const lastYearTotal = sumBilled(inYear(currentYear - 1));
  const twoYearsAgoTotal = sumBilled(inYear(currentYear - 2));
  const allTimeTotal = list.reduce((s, i) => s + Number(i.amount || 0), 0);

  const salesPeriods = {
    "This Year (YTD)": {
      total: ytdTotal,
      changePct: pctChange(ytdTotal, lastYearToDate),
      sub: `Invoiced since 1 Jan ${currentYear}`,
      months: monthsBilled(currentYear),
    },
    "This Month": {
      total: thisMonthBilled,
      changePct: pctChange(thisMonthBilled, lastMonthBilled),
      sub: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      months: [],
    },
    [`Last Year (${currentYear - 1})`]: {
      total: lastYearTotal,
      changePct: pctChange(lastYearTotal, twoYearsAgoTotal),
      sub: `All of ${currentYear - 1}`,
      months: monthsBilled(currentYear - 1),
    },
    "All Time": {
      total: allTimeTotal,
      changePct: null,
      sub: "Everything you've ever invoiced",
      months: [],
    },
  };

  // --- Revenue flow panel (collected) ------------------------------------
  const thisMonthPaid = sumPaid(inMonth(currentYear, currentMonth));
  const lastMonthPaid = sumPaid(inMonth(prevMonthRef.getFullYear(), prevMonthRef.getMonth()));
  const thisYearPaid = sumPaid(inYear(currentYear));
  const lastYearPaid = sumPaid(inYear(currentYear - 1));
  const twoMonthsAgoRef = new Date(currentYear, currentMonth - 2, 1);
  const twoMonthsAgoPaid = sumPaid(inMonth(twoMonthsAgoRef.getFullYear(), twoMonthsAgoRef.getMonth()));

  const thisMonthPct = pctChange(thisMonthPaid, lastMonthPaid);
  const lastMonthPct = pctChange(lastMonthPaid, twoMonthsAgoPaid);
  const thisYearPct = pctChange(thisYearPaid, lastYearPaid);

  const fmt = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  const revenuePeriods = {
    "This Month": {
      total: thisMonthPaid,
      changePct: thisMonthPct,
      changeAmount: thisMonthPaid - lastMonthPaid,
      points: daysPaid(currentYear, currentMonth),
      startLabel: fmt(new Date(currentYear, currentMonth, 1)),
      endLabel: fmt(now),
      ...insightFor(thisMonthPct, thisMonthPaid, "This month"),
    },
    "Last Month": {
      total: lastMonthPaid,
      changePct: lastMonthPct,
      changeAmount: lastMonthPaid - twoMonthsAgoPaid,
      points: daysPaid(prevMonthRef.getFullYear(), prevMonthRef.getMonth()),
      startLabel: fmt(new Date(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), 1)),
      endLabel: fmt(new Date(prevMonthRef.getFullYear(), prevMonthRef.getMonth() + 1, 0)),
      ...insightFor(lastMonthPct, lastMonthPaid, "Last month"),
    },
    "This Year": {
      total: thisYearPaid,
      changePct: thisYearPct,
      changeAmount: thisYearPaid - lastYearPaid,
      points: monthsPaid(currentYear),
      startLabel: `Jan ${currentYear}`,
      endLabel: `Dec ${currentYear}`,
      ...insightFor(thisYearPct, thisYearPaid, "This year"),
    },
  };

  // --- Close ratio --------------------------------------------------------
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

  // --- Outstanding invoices ----------------------------------------------
  const outstandingInvoices = list
    .map((i) => ({
      id: i.id,
      customerName: i.customers ? `${i.customers.first_name} ${i.customers.last_name}` : "Unknown",
      date: i.invoice_date,
      balance: Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0),
    }))
    .filter((i) => i.balance > 0);

  const pendingQuotesValue = (quotes || [])
    .filter((q) => q.status === "Pending")
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  const pendingQuoteCount = (quotes || []).filter((q) => q.status === "Pending").length;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome, Justus 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Here are the latest insights from your company.</p>
      </div>

      {!configured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4">
          This app isn&apos;t connected to a database yet. Copy <code>.env.local.example</code> to{" "}
          <code>.env.local</code> and add your Supabase project details to see real numbers here.
        </div>
      )}

      {/* Quick actions — the four things you actually do all day */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 transition"
          >
            <div className="font-semibold text-sm text-slate-800">{a.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{a.sub}</div>
          </Link>
        ))}
      </div>

      {/* Top row: Sales + Close Ratio on the left, Outstanding on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <SalesPanel periods={salesPeriods} defaultPeriod="This Year (YTD)" />
        <CloseRatioPanel mtd={closeMTD} ytd={closeYTD} />
        <OutstandingInvoicesPanel invoices={outstandingInvoices} className="lg:row-span-2" />
        <div className="lg:col-span-2">
          <RevenuePanel periods={revenuePeriods} defaultPeriod="This Month" />
        </div>
      </div>

      {/* Two quick counts */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/customers" className="bg-white border border-slate-200 rounded-xl p-4 block hover:border-blue-300 transition">
          <div className="text-sm text-slate-500 font-medium">Customers</div>
          <div className="text-2xl font-bold mt-1">{customers?.length ?? 0}</div>
        </Link>
        <Link href="/quotes" className="bg-white border border-slate-200 rounded-xl p-4 block hover:border-blue-300 transition">
          <div className="text-sm text-slate-500 font-medium">Estimates out</div>
          <div className="text-2xl font-bold mt-1">
            ${pendingQuotesValue.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {pendingQuoteCount} waiting on an answer
          </div>
        </Link>
      </div>

      {/* Activity + upcoming work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card
          title="Recent Activity"
          action={
            <Link href="/quotes" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          }
        >
          {(!activity || activity.length === 0) && (
            <p className="text-slate-400 text-sm">
              Nothing yet — this fills in as customers open and answer the estimate links you send.
            </p>
          )}
          {activity && activity.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {activity.map((e) => {
                const meta = ACTIVITY[e.event_type] || { verb: e.event_type, dot: "bg-slate-300" };
                const c = e.quotes?.customers;
                const who = c ? `${c.first_name} ${c.last_name}` : "Someone";
                return (
                  <li key={e.id} className="py-3 flex items-start gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div>
                        {e.quotes ? (
                          <Link href={`/quotes/${e.quotes.id}`} className="font-semibold hover:text-blue-600">
                            {who}
                          </Link>
                        ) : (
                          <span className="font-semibold">{who}</span>
                        )}{" "}
                        <span className="text-slate-500">{meta.verb}</span>
                        {e.quotes?.service_type && <span className="text-slate-400"> · {e.quotes.service_type}</span>}
                      </div>
                      {e.note && <p className="text-slate-600 text-xs mt-1 whitespace-pre-wrap">{e.note}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{timeAgo(e.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Upcoming Jobs"
          action={
            <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all
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
    </div>
  );
}
