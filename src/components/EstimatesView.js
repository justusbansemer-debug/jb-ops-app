"use client";

// The Estimates list — modeled on the QuoteIQ estimates screen:
// a search/filter toolbar, a status tab strip with per-tab counts and
// dollar totals, then date-grouped estimate cards with colored action
// buttons along the bottom of each card.

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const TABS = ["Draft", "Open", "Accepted", "Schedule", "Declined", "Paid", "Archive"];

const RANGES = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 12 Months", days: 365 },
  { label: "All Time", days: null },
];

// Which tab an estimate belongs in. Checked most-final-first, so a paid
// estimate stays under Paid even though it was also once accepted.
function tabOf(q) {
  if (q.archived_at) return "Archive";
  if (q.paid_at) return "Paid";
  if (q.scheduled_job_id) return "Schedule";
  if (q.customer_response === "declined" || q.status === "Declined") return "Declined";
  if (q.customer_response === "accepted" || q.status === "Accepted") return "Accepted";
  if (!q.sent_at) return "Draft";
  return "Open";
}

// The timestamp the card is filed under and displays.
function stampOf(q) {
  const raw = q.sent_at || q.created_at || (q.date_sent ? `${q.date_sent}T12:00:00` : null);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dayLabel(d) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

function shortDate(d) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${String(d.getFullYear()).slice(-2)}`;
}

function clockTime(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function moneyGrouped(n) {
  return `$${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function customerName(q) {
  const c = q.customers;
  if (!c) return "Unknown";
  const full = `${c.first_name || ""} ${c.last_name || ""}`.trim();
  return full || c.company || "Unknown";
}

function initials(q) {
  const c = q.customers;
  const a = (c?.first_name || "").trim()[0] || "";
  const b = (c?.last_name || "").trim()[0] || "";
  return (a + b).toUpperCase() || "??";
}

function addressOf(q) {
  const c = q.customers;
  if (!c) return "";
  return [c.street_address, c.city, c.state, c.zip].filter(Boolean).join(", ");
}

// One line describing where the estimate link stands.
function statusLine(q) {
  if (q.customer_response === "accepted") return "Accepted by customer";
  if (q.customer_response === "declined") return "Declined by customer";
  if (q.customer_response === "change_requested") return "Change requested";
  if (q.first_viewed_at) {
    const d = new Date(q.last_viewed_at || q.first_viewed_at);
    const n = Number(q.view_count || 1);
    const times = n > 1 ? ` (${n}x)` : "";
    return `Viewed @ ${clockTime(d)} ${shortDate(d)}${times}`;
  }
  if (q.sent_at) {
    const d = new Date(q.sent_at);
    return `Sent @ ${clockTime(d)} ${shortDate(d)} — not opened yet`;
  }
  return "Not sent yet";
}

/* ---------------------------------------------------------------- icons */

function Icon({ path, className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const I = {
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" />,
  tag: (
    <>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  check: <path d="m4 12 5 5L20 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  phone: (
    <path d="M6 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  comment: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </>
  ),
  invoice: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  decline: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  dollar: <path d="M12 3v18M16 7.5A3.5 3.5 0 0 0 12.5 4h-1a3.5 3.5 0 0 0 0 7h1a3.5 3.5 0 0 1 0 7h-1A3.5 3.5 0 0 1 8 14.5" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  dots: (
    <>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
};

/* ------------------------------------------------------------- controls */

// A small dropdown that looks like the QuoteIQ filter chips.
function Dropdown({ icon, value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full flex items-center justify-between gap-2 border border-slate-300 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-700 hover:border-slate-400"
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <Icon path={icon} className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className="truncate">{value}</span>
        </span>
        <Icon path={I.chevron} className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                o === value ? "text-orange-600 font-semibold" : "text-slate-700"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The per-card "..." menu.
function CardMenu({ q, onArchive }) {
  const [open, setOpen] = useState(false);
  const archived = Boolean(q.archived_at);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="More actions"
        className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50"
      >
        <Icon path={I.dots} className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
          <Link
            href={`/quotes/${q.id}`}
            className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            View / Send
          </Link>
          <Link
            href={`/quotes/${q.id}/edit`}
            className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
              onArchive(q.id, archived ? "unarchive" : "archive");
            }}
            className="block w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            {archived ? "Move out of Archive" : "Archive"}
          </button>
        </div>
      )}
    </div>
  );
}

// Inline comment box, so a note can be left without opening the estimate.
function AddComment({ quoteId, action }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600"
      >
        <Icon path={I.comment} className="w-4 h-4" />
        <span className="underline underline-offset-2">Add Comment</span>
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => setTimeout(() => setOpen(false), 0)}
      className="space-y-2"
    >
      <input type="hidden" name="quote_id" value={quoteId} />
      <textarea
        name="note"
        rows={2}
        autoFocus
        placeholder="Add a note to this estimate's activity log…"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
        >
          Save comment
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// One colored action button along the bottom of a card.
function ActionButton({ action, quoteId, op, tone, icon, label }) {
  const tones = {
    blue: "bg-sky-100 hover:bg-sky-200 text-sky-900",
    amber: "bg-amber-100 hover:bg-amber-200 text-amber-900",
    red: "bg-red-200 hover:bg-red-300 text-red-900",
    green: "bg-green-200 hover:bg-green-300 text-green-900",
  };
  return (
    <form action={action} className="flex-1">
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="op" value={op} />
      <button
        type="submit"
        className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition ${tones[tone]}`}
      >
        <Icon path={icon} className="w-4 h-4" />
        {label}
      </button>
    </form>
  );
}

/* ----------------------------------------------------------------- card */

function EstimateCard({ q, stamp, actionRef, commentAction, onArchive, selectMode, selected, onToggle }) {
  const addr = addressOf(q);
  const phone = q.customers?.phone;
  const tab = tabOf(q);

  // Which colored buttons this card shows. An estimate that has never
  // been sent (or has no price yet) can't be invoiced.
  const canInvoice = Number(q.amount || 0) > 0 && !q.paid_at;
  const canSchedule = !q.scheduled_job_id && !q.archived_at;
  const canDecline = tab !== "Declined" && !q.archived_at;
  const canPaid = !q.paid_at && !q.archived_at;

  return (
    <div
      className={`relative bg-white border rounded-xl overflow-hidden transition ${
        selected ? "border-orange-400 ring-2 ring-orange-200" : "border-slate-200"
      }`}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-800" aria-hidden="true" />

      <div className="pl-5 pr-4 py-4 space-y-3">
        {/* top row: who / type / when / number */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {selectMode && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(q.id)}
                aria-label={`Select estimate ${q.quote_number ?? ""}`}
                className="w-4 h-4 accent-orange-600"
              />
            )}
            <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold flex items-center justify-center">
              {initials(q)}
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
              {q.quote_type || "Standard"}
              <Icon path={I.info} className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
            {stamp && (
              <>
                <span className="flex items-center gap-1">
                  <Icon path={I.calendar} className="w-3.5 h-3.5" />
                  {shortDate(stamp)}
                </span>
                <span className="flex items-center gap-1">
                  <Icon path={I.clock} className="w-3.5 h-3.5" />
                  {clockTime(stamp)}
                </span>
              </>
            )}
            <span className="font-semibold text-slate-600">
              #{q.quote_number ?? "—"}
            </span>
          </div>
        </div>

        {/* name + price */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/quotes/${q.id}`}
            className="flex items-center gap-2 min-w-0 text-lg font-bold text-slate-900 hover:text-orange-600"
          >
            <Icon path={I.user} className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{customerName(q)}</span>
            <Icon path={I.external} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </Link>
          <div className="text-2xl font-bold text-slate-900 shrink-0">{money(q.amount)}</div>
        </div>

        {/* address / phone / menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 text-sm">
            {addr && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(addr)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sky-700 hover:underline"
              >
                <Icon path={I.pin} className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <span>{addr}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 text-sky-700 hover:underline"
              >
                <Icon path={I.phone} className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{phone}</span>
              </a>
            )}
            {q.service_type && (
              <div className="text-xs text-slate-400">{q.service_type}</div>
            )}
          </div>

          <CardMenu q={q} onArchive={onArchive} />
        </div>

        {/* link status + activity log */}
        <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
          <span className="flex items-center gap-2 text-slate-600">
            <Icon path={I.eye} className="w-4 h-4 text-slate-400" />
            <span>
              <span className="font-semibold text-slate-700">Status:</span> {statusLine(q)}
            </span>
          </span>
          <Link
            href={`/quotes/${q.id}#activity`}
            className="flex items-center gap-1.5 text-slate-500 hover:text-orange-600"
          >
            <Icon path={I.clock} className="w-4 h-4" />
            View Log
          </Link>
        </div>

        <AddComment quoteId={q.id} action={commentAction} />

        {/* colored actions */}
        <div className="flex items-stretch gap-2 flex-wrap">
          {canSchedule && (
            <ActionButton
              action={actionRef}
              quoteId={q.id}
              op="schedule"
              tone="blue"
              icon={I.calendar}
              label="Schedule"
            />
          )}
          {canInvoice && (
            <ActionButton
              action={actionRef}
              quoteId={q.id}
              op="invoice"
              tone="amber"
              icon={I.invoice}
              label="Invoice"
            />
          )}
          {canDecline && (
            <ActionButton
              action={actionRef}
              quoteId={q.id}
              op="decline"
              tone="red"
              icon={I.decline}
              label="Decline"
            />
          )}
          {canPaid && (
            <ActionButton
              action={actionRef}
              quoteId={q.id}
              op="paid"
              tone="green"
              icon={I.dollar}
              label="Paid"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- page */

export default function EstimatesView({
  quotes = [],
  services = [],
  cardAction,
  commentAction,
  bulkAction,
}) {
  const [search, setSearch] = useState("");
  const [service, setService] = useState("All Services");
  const [range, setRange] = useState("Last 90 Days");
  const [tab, setTab] = useState("Open");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const serviceOptions = useMemo(
    () => ["All Services", ...services.filter(Boolean)],
    [services]
  );

  // Rows that survive search / service / date-range. The tab counts are
  // computed from this set, so the totals always match what's on screen.
  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.label === range)?.days ?? null;
    const cutoff = days ? Date.now() - days * 86400000 : null;
    const needle = search.trim().toLowerCase();

    return quotes
      .map((q) => ({ q, stamp: stampOf(q) }))
      .filter(({ q, stamp }) => {
        if (cutoff && stamp && stamp.getTime() < cutoff) return false;
        if (service !== "All Services" && q.service_type !== service) return false;
        if (!needle) return true;
        const hay = [
          customerName(q),
          q.customers?.company,
          addressOf(q),
          q.customers?.phone,
          q.service_type,
          q.notes,
          q.quote_number != null ? `#${q.quote_number}` : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
  }, [quotes, search, service, range]);

  const summary = useMemo(() => {
    const base = Object.fromEntries(TABS.map((t) => [t, { count: 0, total: 0 }]));
    for (const { q } of filtered) {
      const t = tabOf(q);
      base[t].count += 1;
      base[t].total += Number(q.amount || 0);
    }
    return base;
  }, [filtered]);

  const visible = useMemo(
    () =>
      filtered
        .filter(({ q }) => tabOf(q) === tab)
        .sort((a, b) => (b.stamp?.getTime() || 0) - (a.stamp?.getTime() || 0)),
    [filtered, tab]
  );

  // Cards are grouped under a gray date band, newest day first.
  const groups = useMemo(() => {
    const out = [];
    for (const item of visible) {
      const label = item.stamp ? dayLabel(item.stamp) : "No date";
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }, [visible]);

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function handleArchive(id, op) {
    const fd = new FormData();
    fd.set("ids", id);
    fd.set("op", op);
    bulkAction(fd);
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Estimates</h1>
        <Link
          href="#add"
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          <Icon path={I.plus} className="w-4 h-4" />
          Create
        </Link>
      </div>

      {/* toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon path={I.search} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Estimate"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <Dropdown icon={I.tag} value={service} options={serviceOptions} onChange={setService} />
        <Dropdown value={range} options={RANGES.map((r) => r.label)} onChange={setRange} />

        <button
          type="button"
          onClick={() => {
            setSelectMode((v) => !v);
            setSelected([]);
          }}
          className={`flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg ${
            selectMode
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
        >
          <Icon path={I.check} className="w-4 h-4" />
          Select
        </button>

        <Link
          href="#add"
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap"
        >
          <Icon path={I.plus} className="w-4 h-4" />
          Create Estimate
        </Link>
      </div>

      {/* status tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex items-stretch gap-6 min-w-max px-1">
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pb-2 pt-1 text-center border-b-2 transition ${
                  active ? "border-slate-800" : "border-transparent"
                }`}
              >
                <div
                  className={`text-sm ${
                    active ? "font-bold text-slate-900" : "font-medium text-slate-400"
                  }`}
                >
                  {t} ({summary[t].count})
                </div>
                <div
                  className={`text-sm ${
                    active ? "font-bold text-slate-900" : "text-slate-400"
                  }`}
                >
                  {moneyGrouped(summary[t].total)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* bulk bar */}
      {selectMode && (
        <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <span className="text-sm text-slate-600">
            {selected.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => {
                const fd = new FormData();
                fd.set("ids", selected.join(","));
                fd.set("op", tab === "Archive" ? "unarchive" : "archive");
                bulkAction(fd);
                setSelected([]);
                setSelectMode(false);
              }}
              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2 rounded-lg"
            >
              {tab === "Archive" ? "Move out of Archive" : "Archive selected"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectMode(false);
                setSelected([]);
              }}
              className="text-sm text-slate-500 hover:text-slate-700 px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* cards */}
      {groups.length === 0 && (
        <p className="text-slate-400 text-sm py-8 text-center">
          Nothing in {tab} for this filter.
        </p>
      )}

      {groups.map((g) => (
        <div key={g.label} className="space-y-3">
          <div className="bg-slate-100 text-slate-600 text-sm font-semibold rounded-md px-3 py-1.5">
            {g.label}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {g.items.map(({ q, stamp }) => (
              <EstimateCard
                key={q.id}
                q={q}
                stamp={stamp}
                actionRef={cardAction}
                commentAction={commentAction}
                onArchive={handleArchive}
                selectMode={selectMode}
                selected={selected.includes(q.id)}
                onToggle={toggle}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
