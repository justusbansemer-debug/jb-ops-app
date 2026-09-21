"use client";

import { useMemo, useState } from "react";

// Step 1: who the estimate is for, and where the work is.

function label(c) {
  return `${c.first_name} ${c.last_name}${c.company ? ` (${c.company})` : ""}`;
}

function addressOf(c) {
  if (!c) return "";
  const line2 = [c.city, c.state].filter(Boolean).join(", ");
  return [c.street_address, line2, c.zip].filter(Boolean).join(" ").trim();
}

export default function StepCustomer({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const picked = customers.find((c) => c.id === value.customerId) || null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers.filter((c) => label(c).toLowerCase().includes(q)).slice(0, 12);
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          Customer
        </div>
        <div className="p-4 space-y-3">
          {picked ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{label(picked)}</div>
                <div className="text-sm text-slate-500">{picked.phone || "No phone on file"}</div>
                <div className="text-sm text-slate-500 truncate">{addressOf(picked) || "No address on file"}</div>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...value, customerId: "" })}
                className="text-sm font-semibold text-blue-600 shrink-0"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers by name"
                autoComplete="off"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onChange({ ...value, customerId: c.id })}
                      className="w-full text-left py-3 hover:bg-slate-50 rounded-lg px-2"
                    >
                      <div className="font-medium">{label(c)}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {addressOf(c) || c.phone || "—"}
                      </div>
                    </button>
                  </li>
                ))}
                {matches.length === 0 && (
                  <li className="py-3 text-sm text-slate-400">No customer matches “{query}”.</li>
                )}
              </ul>
              <a href="/customers#add" className="block text-sm font-semibold text-blue-600">
                + New customer
              </a>
            </>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          Job address
        </div>
        <div className="p-4">
          <input
            value={value.jobAddress}
            onChange={(e) => onChange({ ...value, jobAddress: e.target.value })}
            placeholder={picked ? addressOf(picked) || "Where is the work?" : "Where is the work?"}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-2">
            Leave it blank to use the address on the customer&apos;s record.
          </p>
        </div>
      </section>
    </div>
  );
}
