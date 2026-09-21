"use client";

import { useMemo, useState } from "react";
import ServiceRow from "./ServiceRow";
import { lineTotal, money } from "./math";

// Step 2: the list of your saved services, each with its own price and
// quantity. Anything with a total above zero is on the estimate.

export default function StepServices({ items, onChange, onAddCustom }) {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  const on = items.filter((i) => i.included && lineTotal(i) > 0);
  const subtotal = on.reduce((s, i) => s + lineTotal(i), 0);
  const picked = on.length;

  function update(key, next) {
    onChange(items.map((i) => (i.key === key ? next : i)));
  }

  function clear(key) {
    onChange(
      items.map((i) =>
        i.key === key
          ? { ...i, included: false, quantity: "", flat: "", unit_price: i.base_price ?? "" }
          : i
      )
    );
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search services"
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="button"
        onClick={onAddCustom}
        className="w-full bg-navy-800 hover:bg-navy-700 text-white font-semibold py-3 rounded-xl"
      >
        + Add a one-off service
      </button>

      {shown.length === 0 && (
        <p className="text-sm text-slate-400 py-4">
          No services match “{query}”. Add your price list under Settings → My services.
        </p>
      )}

      <div className="space-y-2">
        {shown.map((item) => (
          <ServiceRow
            key={item.key}
            item={item}
            open={openKey === item.key}
            onToggle={() => setOpenKey(openKey === item.key ? null : item.key)}
            onChange={(next) => update(item.key, next)}
            onRemove={() => clear(item.key)}
          />
        ))}
      </div>

      <div className="sticky bottom-20 lg:bottom-4 bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="text-sm text-slate-500">
          {picked} service{picked === 1 ? "" : "s"} on this estimate
        </span>
        <span className="font-bold">{money(subtotal)}</span>
      </div>
    </div>
  );
}
