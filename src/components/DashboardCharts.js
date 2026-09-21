"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, Tile } from "./ui";

/* ---------------------------------------------------------------- helpers */

function money(n) {
  return `$${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortMoney(n) {
  const v = Number(n || 0);
  if (v >= 1000) {
    const k = v / 1000;
    return `$${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return `$${Math.round(v)}`;
}

// Rounds an axis maximum up to a friendly number so the tick labels never
// collapse into "$1 $1 $1 $0 $0" when there isn't much data yet.
function niceMax(v) {
  if (!v || v <= 0) return 100;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const n = v / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * base;
}

function PeriodSelect({ value, onChange, options }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function TrendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function PercentIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 5 5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

function InvoiceIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.5 6.5 2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/* ------------------------------------------------------------- line chart */

// Inline line/area chart — no charting library. Points come in already in
// order: [{ label, value }].
export function RevenueFlowChart({ points, startLabel, endLabel }) {
  const width = 500;
  const height = 150;

  const values = points.map((p) => Number(p.value) || 0);
  const max = niceMax(Math.max(0, ...values));

  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - ((Number(p.value) || 0) / max) * height,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => max * f);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between text-[11px] text-slate-400 py-1 text-right shrink-0 w-10">
        {yTicks.map((t, i) => (
          <div key={i}>{shortMoney(t)}</div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" preserveAspectRatio="none">
          {yTicks.map((t, i) => {
            const y = height - (t / max) * height;
            return <line key={i} x1="0" y1={y} x2={width} y2={y} stroke="#eef2f7" strokeWidth="1" />;
          })}
          <polygon points={areaPoints} fill="#dbeafe" opacity="0.7" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </div>
    </div>
  );
}

// Simple monthly bar chart, used by the YTD Sales card's "Show chart".
function MonthlyBars({ months }) {
  const max = niceMax(Math.max(0, ...months.map((m) => Number(m.value) || 0)));
  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {months.map((m) => {
          const pct = ((Number(m.value) || 0) / max) * 100;
          return (
            <div key={m.label} className="flex-1 flex flex-col justify-end h-full" title={`${m.label}: ${money(m.value)}`}>
              <div
                className="bg-blue-600 rounded-t-[3px] min-h-[2px]"
                style={{ height: `${Math.max(pct, 1)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1.5">
        {months.map((m) => (
          <div key={m.label} className="flex-1 text-[10px] text-slate-400 text-center">
            {m.label.charAt(0)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ sales panel */

// YTD Sales, with a period dropdown and a show/hide monthly chart.
export function SalesPanel({ periods, defaultPeriod }) {
  const options = Object.keys(periods);
  const [period, setPeriod] = useState(defaultPeriod || options[0]);
  const [showChart, setShowChart] = useState(false);
  const data = periods[period] || { total: 0, changePct: null, months: [] };
  const up = (data.changePct ?? 0) >= 0;

  return (
    <Panel
      title="Sales"
      icon={<TrendIcon className="w-[18px] h-[18px] text-blue-600" />}
      control={<PeriodSelect value={period} onChange={setPeriod} options={options} />}
    >
      <Tile>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="text-[26px] sm:text-3xl font-bold tracking-tight">{money(data.total)}</div>
          {data.changePct !== null && data.changePct !== undefined ? (
            <div className={`flex items-center gap-1 text-sm font-semibold ${up ? "text-blue-600" : "text-red-600"}`}>
              <TrendIcon className={`w-4 h-4 ${up ? "" : "rotate-90"}`} />
              {Math.abs(data.changePct).toFixed(0)}% {up ? "increase" : "decrease"}
            </div>
          ) : (
            <div className="text-xs text-slate-400">No earlier period to compare</div>
          )}
        </div>
        {data.sub && <div className="text-xs text-slate-400 mt-1">{data.sub}</div>}

        {data.months?.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowChart((v) => !v)}
              className="mt-3 w-full bg-navy-800 hover:bg-navy-700 text-white font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              <TrendIcon className="w-4 h-4" />
              {showChart ? "Hide chart" : "Show chart"}
            </button>
            {showChart && (
              <div className="mt-4">
                <MonthlyBars months={data.months} />
              </div>
            )}
          </>
        )}
      </Tile>
    </Panel>
  );
}

/* ------------------------------------------------------ close ratio panel */

export function CloseRatioPanel({ mtd, ytd }) {
  const row = (label, value) => (
    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className="bg-navy-800 text-white text-sm font-bold px-3 py-1 rounded-lg min-w-[72px] text-center">
        {value !== null && value !== undefined ? `${value.toFixed(2)}%` : "—"}
      </span>
    </div>
  );

  return (
    <Panel title="Close Ratio" icon={<PercentIcon className="w-[18px] h-[18px] text-blue-600" />}>
      <div className="bg-slate-50 rounded-xl p-2 space-y-2">
        {row("MTD", mtd)}
        {row("YTD", ytd)}
      </div>
      <p className="text-xs text-slate-400 mt-3">Estimates accepted out of the ones customers answered.</p>
    </Panel>
  );
}

/* ---------------------------------------------------- revenue flow panel */

export function RevenuePanel({ periods, defaultPeriod }) {
  const options = Object.keys(periods);
  const [period, setPeriod] = useState(defaultPeriod || options[0]);
  const data = periods[period] || { total: 0, points: [] };
  const up = (data.changePct ?? 0) >= 0;

  return (
    <Panel
      title="Revenue Flow"
      icon={<SparkIcon className="w-[18px] h-[18px] text-blue-600" />}
      control={<PeriodSelect value={period} onChange={setPeriod} options={options} />}
    >
      <Tile>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 items-center">
          <div>
            <div className="text-[26px] sm:text-3xl font-bold tracking-tight">{money(data.total)}</div>
            <div className="text-sm text-slate-500">Total revenue</div>
            {data.changePct !== null && data.changePct !== undefined && (
              <div className="text-sm font-semibold mt-1">
                <span className={up ? "text-green-600" : "text-red-600"}>
                  {up ? "+" : ""}
                  {data.changePct.toFixed(0)}% ({money(Math.abs(data.changeAmount || 0))})
                </span>
                <span className="text-slate-400"> · {period}</span>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3">
              <div className="font-semibold text-sm">{data.headline || "Revenue so far"}</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{data.insight}</p>
            </div>
          </div>

          <RevenueFlowChart points={data.points || []} startLabel={data.startLabel} endLabel={data.endLabel} />
        </div>
      </Tile>
    </Panel>
  );
}

/* ------------------------------------------------ outstanding invoices */

const SORTS = ["Oldest", "Newest", "Price"];

export function OutstandingInvoicesPanel({ invoices, className = "" }) {
  const [sort, setSort] = useState("Oldest");
  const [query, setQuery] = useState("");

  const totalUnpaid = useMemo(() => invoices.reduce((sum, i) => sum + i.balance, 0), [invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? invoices.filter((i) => i.customerName.toLowerCase().includes(q)) : invoices;
    list = [...list];
    if (sort === "Oldest") list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    if (sort === "Newest") list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (sort === "Price") list.sort((a, b) => b.balance - a.balance);
    return list;
  }, [invoices, sort, query]);

  return (
    <Panel
      title="Outstanding Invoices"
      icon={<InvoiceIcon className="w-[18px] h-[18px] text-blue-600" />}
      className={className}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`py-2 rounded-full text-sm font-semibold transition ${
                sort === s ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search outstanding invoices"
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {invoices.length === 0 ? (
          <div className="pt-1">
            <p className="text-slate-500 text-sm">Invoices that are past due or waiting on payment show up here.</p>
            <p className="font-semibold mt-2 text-sm">Total unpaid: nothing outstanding</p>
            <p className="text-slate-400 text-sm">Once you bill a job, you can chase it from here.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              Total unpaid: <span className="font-semibold text-slate-800">{money(totalUnpaid)}</span>
            </p>
            <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {filtered.map((i) => (
                <li key={i.id} className="py-3 flex items-center justify-between text-sm gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{i.customerName}</div>
                    <div className="text-xs text-slate-400">{i.date || "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{money(i.balance)}</div>
                    <Link href={`/invoices/${i.id}/edit`} className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {filtered.length === 0 && <p className="text-slate-400 text-sm">No matches for &quot;{query}&quot;.</p>}
          </>
        )}
      </div>
    </Panel>
  );
}
