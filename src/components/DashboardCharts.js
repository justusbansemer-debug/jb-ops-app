"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// A small inline line/area chart for daily revenue this month — no charting
// library needed. Takes points already in day order: [{ label, value }].
export function RevenueFlowChart({ points, startLabel, endLabel }) {
  const width = 500;
  const height = 150;

  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values);

  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - (p.value / max) * height;
    return { x, y };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;

  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(max * f));

  const formatTick = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between text-xs text-slate-400 py-1 text-right shrink-0">
        {yTicks.map((t, i) => (
          <div key={i}>{formatTick(t)}</div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" preserveAspectRatio="none">
          {yTicks.map((t, i) => {
            const y = height - (t / (max || 1)) * height;
            return <line key={i} x1="0" y1={y} x2={width} y2={y} stroke="#eef2f7" strokeWidth="1" />;
          })}
          <polygon points={areaPoints} fill="#ede9fe" opacity="0.6" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </div>
    </div>
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

const SORTS = ["Oldest", "Newest", "Price"];

// Client-side search + sort over the outstanding (unpaid/partial) invoices
// list, computed server-side and passed in as plain data.
export function OutstandingInvoicesPanel({ invoices }) {
  const [sort, setSort] = useState("Oldest");
  const [query, setQuery] = useState("");

  const totalUnpaid = useMemo(
    () => invoices.reduce((sum, i) => sum + i.balance, 0),
    [invoices]
  );

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
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {SORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              sort === s ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
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
          className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {invoices.length === 0 ? (
        <div>
          <p className="text-slate-500 text-sm">Review invoices that are past due or pending payment.</p>
          <p className="font-semibold mt-2 text-sm">Total Unpaid Invoices: No Open Invoice Data</p>
          <p className="text-slate-400 text-sm">Once you have invoices, you can manage them here.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Total Unpaid: <span className="font-semibold text-slate-800">${totalUnpaid.toFixed(2)}</span>
          </p>
          <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {filtered.map((i) => (
              <li key={i.id} className="py-3 flex items-center justify-between text-sm gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{i.customerName}</div>
                  <div className="text-xs text-slate-400">{i.date || "—"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">${i.balance.toFixed(2)}</div>
                  <Link href={`/invoices/${i.id}/edit`} className="text-xs text-orange-600 hover:underline">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p className="text-slate-400 text-sm">No matches for &quot;{query}&quot;.</p>
          )}
        </>
      )}
    </div>
  );
}
