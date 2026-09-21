"use client";

// The month grid. Days are bucketed in the browser so a 7pm job lands on the
// right day in YOUR timezone, not the server's.
import Link from "next/link";
import { useMemo, useState } from "react";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TONE = {
  Scheduled: { chip: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  "In Progress": { chip: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-500" },
  Completed: { chip: "bg-green-50 text-green-800 border-green-200", dot: "bg-green-600" },
  Cancelled: { chip: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};
const FALLBACK = { chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };

function toneOf(status) {
  return TONE[status] || FALLBACK;
}

// YYYY-MM-DD in local time — the key everything is bucketed by.
function dayKey(d) {
  return d.toLocaleDateString("en-CA");
}

function timeLabel(d) {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(":00", "")
    .toLowerCase()
    .replace(" ", "");
}

function nameOf(j) {
  const c = j.customers;
  return c ? [c.first_name, c.last_name].filter(Boolean).join(" ") : "";
}

export default function CalendarView({ year, month, jobs, prevHref, nextHref }) {
  const todayKey = dayKey(new Date());

  // Bucket every job under its local day.
  const byDay = useMemo(() => {
    const map = new Map();
    for (const j of jobs) {
      if (!j.scheduled_at) continue;
      const d = new Date(j.scheduled_at);
      if (Number.isNaN(d.getTime())) continue;
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push({ ...j, _date: d });
    }
    for (const list of map.values()) list.sort((a, b) => a._date - b._date);
    return map;
  }, [jobs]);

  // The 6-week grid this month sits in.
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Default to today if it's in this month, otherwise the first day with work.
  const initial = useMemo(() => {
    const inMonth = cells.filter((d) => d.getMonth() === month - 1);
    if (inMonth.some((d) => dayKey(d) === todayKey)) return todayKey;
    const busy = inMonth.map(dayKey).find((k) => byDay.has(k));
    return busy || dayKey(inMonth[0]);
  }, [cells, month, byDay, todayKey]);

  const [selected, setSelected] = useState(initial);
  const selectedJobs = byDay.get(selected) || [];

  const monthJobs = cells
    .filter((d) => d.getMonth() === month - 1)
    .flatMap((d) => byDay.get(dayKey(d)) || []);
  const monthValue = monthJobs.reduce((sum, j) => sum + Number(j.price || 0), 0);

  return (
    <div className="space-y-4">
      {/* month bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{monthLabel}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {monthJobs.length} {monthJobs.length === 1 ? "job" : "jobs"}
            {monthValue > 0 && ` · $${monthValue.toFixed(2)}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={prevHref}
            aria-label="Previous month"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            ‹
          </Link>
          <Link
            href="/calendar"
            className="px-3 h-9 flex items-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </Link>
          <Link
            href={nextHref}
            aria-label="Next month"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            ›
          </Link>
        </div>
      </div>

      {/* grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {DOW.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const k = dayKey(d);
            const list = byDay.get(k) || [];
            const outside = d.getMonth() !== month - 1;
            const isToday = k === todayKey;
            const isSelected = k === selected;

            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                className={`relative text-left border-b border-r border-slate-100 min-h-16 sm:min-h-24 p-1.5 transition ${
                  outside ? "bg-slate-50/60" : "bg-white"
                } ${isSelected ? "ring-2 ring-inset ring-orange-400" : "hover:bg-orange-50/40"}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-orange-600 text-white"
                      : outside
                      ? "text-slate-300"
                      : "text-slate-600"
                  }`}
                >
                  {d.getDate()}
                </span>

                {/* phones: dots */}
                {list.length > 0 && (
                  <span className="sm:hidden flex flex-wrap gap-0.5 mt-1">
                    {list.slice(0, 4).map((j) => (
                      <span
                        key={j.id}
                        className={`w-1.5 h-1.5 rounded-full ${toneOf(j.status).dot}`}
                      />
                    ))}
                  </span>
                )}

                {/* bigger screens: chips */}
                <span className="hidden sm:block space-y-0.5 mt-1">
                  {list.slice(0, 3).map((j) => (
                    <span
                      key={j.id}
                      className={`block truncate text-[11px] leading-tight px-1 py-0.5 rounded border ${toneOf(j.status).chip}`}
                    >
                      {timeLabel(j._date)} {nameOf(j) || j.service_type}
                    </span>
                  ))}
                  {list.length > 3 && (
                    <span className="block text-[11px] text-slate-400 px-1">
                      +{list.length - 3} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* the day you tapped */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">
            {new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <Link
            href="/jobs#add"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 shrink-0"
          >
            + New job
          </Link>
        </div>

        {selectedJobs.length === 0 ? (
          <p className="text-slate-400 text-sm mt-3">Nothing booked this day.</p>
        ) : (
          <ul className="divide-y divide-slate-100 mt-2">
            {selectedJobs.map((j) => (
              <li key={j.id} className="py-3">
                <Link href={`/jobs/${j.id}`} className="flex items-start gap-3 group">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${toneOf(j.status).dot}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-sm group-hover:text-orange-600">
                      {timeLabel(j._date)} · {j.service_type}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">
                      {nameOf(j) || "No customer"}
                      {j.duration_minutes
                        ? ` · ${(Number(j.duration_minutes) / 60)
                            .toFixed(2)
                            .replace(/\.?0+$/, "")} hr`
                        : ""}
                    </span>
                  </span>
                  {j.price != null && (
                    <span className="text-sm font-semibold shrink-0">
                      ${Number(j.price).toFixed(2)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* key */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 px-1">
        {["Scheduled", "In Progress", "Completed", "Cancelled"].map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${toneOf(s).dot}`} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
