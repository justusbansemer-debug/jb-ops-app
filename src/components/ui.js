// Small, reusable pieces of UI shared across pages.

export function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// A titled panel with a light header strip — the card style used across the
// dashboard: icon + title on the left, an optional control (a period
// dropdown, a link) on the right, content below.
export function Panel({ icon, title, control, children, className = "", bodyClassName = "p-4 sm:p-5", id }) {
  return (
    <section id={id} className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="font-semibold text-slate-800 text-[15px] sm:text-base truncate">{title}</h2>
        </div>
        {control}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

// The inner white/tinted box the dashboard puts a headline number inside.
export function Tile({ children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${className}`}>{children}</div>
  );
}

const STATUS_COLORS = {
  Scheduled: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-green-50 text-green-700",
  Cancelled: "bg-slate-100 text-slate-500",
  Pending: "bg-amber-50 text-amber-700",
  Accepted: "bg-green-50 text-green-700",
  Declined: "bg-red-50 text-red-700",
  Expired: "bg-slate-100 text-slate-500",
  Paid: "bg-green-50 text-green-700",
  Partial: "bg-amber-50 text-amber-700",
  Unpaid: "bg-red-50 text-red-700",
};

export function StatusPill({ status }) {
  const cls = STATUS_COLORS[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}

export function Card({ title, action, children, className = "", id }) {
  return (
    <div id={id} className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-semibold text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ children, ...props }) {
  return (
    <button
      {...props}
      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition"
    >
      {children}
    </button>
  );
}

export function Input({ label, name, type = "text", required, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        {...props}
        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

export function Select({ label, name, options, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      <select
        name={name}
        {...props}
        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

// Renders a value/label pair inside a mobile card row. Used across the
// Customers/Jobs/Quotes/Invoices "card view" that replaces wide tables
// on small screens.
export function CardField({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 text-right">{value}</span>
    </div>
  );
}

// A single tappable-feeling row for the mobile card list. Desktop keeps
// the classic table; this is what phones see instead.
export function MobileCard({ title, subtitle, topRight, children }) {
  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs text-slate-400 truncate">{subtitle}</div>}
        </div>
        {topRight}
      </div>
      {children && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );
}
