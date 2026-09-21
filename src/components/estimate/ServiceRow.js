"use client";

import { byQuantity, lineTotal, money, unitWord } from "./math";

// One service in the picker: tap the name to open it, type a price or a
// quantity, and the total updates as you go. A line counts as "on the
// estimate" as soon as its total is above zero.

const box =
  "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ServiceRow({ item, open, onToggle, onChange, onRemove }) {
  const total = lineTotal(item);
  const included = Boolean(item.included) && total > 0;
  const edit = (next) => onChange({ ...next, included: true });
  const qty = byQuantity(item.pricing_type);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${included ? "bg-blue-600" : "bg-slate-200"}`}
        />
        <span className="font-semibold text-slate-800 flex-1 min-w-0 truncate">{item.name}</span>
        {included && <span className="text-sm font-semibold text-blue-700">{money(total)}</span>}
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {qty && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-slate-500">
                  Price per {item.pricing_type === "hourly" ? "hour" : item.unit_label || "unit"}
                </span>
                <input
                  inputMode="decimal"
                  value={item.unit_price}
                  onChange={(e) => edit({ ...item, unit_price: e.target.value })}
                  className={box}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-500">{unitWord(item)}</span>
                <input
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(e) => edit({ ...item, quantity: e.target.value })}
                  className={box}
                />
              </label>
            </div>
          )}

          <label className="block text-sm">
            <span className="text-slate-500">{qty ? "Or a flat price" : "Price"}</span>
            <input
              inputMode="decimal"
              value={qty ? item.flat : item.unit_price}
              onChange={(e) =>
                edit(qty ? { ...item, flat: e.target.value } : { ...item, unit_price: e.target.value })
              }
              placeholder="0.00"
              className={box}
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-500">What&apos;s included (the customer reads this)</span>
            <textarea
              rows={2}
              value={item.notes}
              onChange={(e) => onChange({ ...item, notes: e.target.value })}
              className={box}
            />
          </label>

          {!included && total > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...item, included: true })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg"
            >
              Add {money(total)} to the estimate
            </button>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-slate-500">
              Line total <span className="font-bold text-slate-900">{money(total)}</span>
            </div>
            {included && (
              <button type="button" onClick={onRemove} className="text-sm font-semibold text-red-600">
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
