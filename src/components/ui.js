// Small, reusable pieces of UI shared across pages.

export function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
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
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export function Card({ title, action, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
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
      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-4 py-2 rounded-lg"
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
        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
