"use client";

// Pick one of your saved services when writing an estimate and the price and
// the "what's included" notes fill themselves in. Anything can still be typed
// over by hand — this is a head start, not a lock.
import { useState } from "react";

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function priceLabel(s) {
  if (s.pricing_type === "custom" || s.price == null) return "priced per job";
  if (s.pricing_type === "range")
    return s.price_max != null
      ? `${money(s.price)}–${money(s.price_max)}`
      : money(s.price);
  if (s.pricing_type === "hourly") return `${money(s.price)}/hr`;
  if (s.pricing_type === "per_unit")
    return `${money(s.price)}/${s.unit_label || "unit"}`;
  return money(s.price);
}

// Services priced by quantity need a number from you before there's a total.
function needsQuantity(s) {
  return s && (s.pricing_type === "per_unit" || s.pricing_type === "hourly");
}

function unitFor(s) {
  if (!s) return "";
  return s.pricing_type === "hourly" ? "hours" : s.unit_label || "units";
}

function startingAmount(s, qty) {
  if (!s || s.price == null || s.pricing_type === "custom") return "";
  if (needsQuantity(s)) {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return "";
    return (Number(s.price) * n).toFixed(2);
  }
  return Number(s.price).toFixed(2);
}

const fieldClass =
  "mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

export default function ServicePicker({ services = [], types = [] }) {
  const [serviceType, setServiceType] = useState("");
  const [picked, setPicked] = useState(null); // the saved service, if one
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  // Remembers what we filled in, so we only overwrite our own text.
  const [autoNotes, setAutoNotes] = useState("");

  function onPick(e) {
    const key = e.target.value;

    if (!key) {
      setPicked(null);
      setServiceType("");
      return;
    }

    if (key.startsWith("t:")) {
      setPicked(null);
      setServiceType(key.slice(2));
      return;
    }

    const s = services.find((x) => String(x.id) === key.slice(2));
    if (!s) return;

    setPicked(s);
    setServiceType(s.name);

    const nextQty = needsQuantity(s) ? "" : "";
    setQty(nextQty);
    setAmount(startingAmount(s, nextQty));

    // Only replace the notes if they're empty or still ours.
    if (!notes.trim() || notes === autoNotes) {
      const fill = s.default_notes || "";
      setNotes(fill);
      setAutoNotes(fill);
    }
  }

  function onQty(e) {
    const v = e.target.value;
    setQty(v);
    setAmount(startingAmount(picked, v));
  }

  return (
    <>
      <label className="block text-sm">
        <span className="text-slate-600 font-medium">Service</span>
        <select
          required
          defaultValue=""
          onChange={onPick}
          className={`${fieldClass} bg-white`}
        >
          <option value="" disabled>
            Pick a service…
          </option>
          {services.length > 0 && (
            <optgroup label="My services">
              {services.map((s) => (
                <option key={s.id} value={`s:${s.id}`}>
                  {s.name} — {priceLabel(s)}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={services.length > 0 ? "Other" : "Service types"}>
            {types.map((t) => (
              <option key={t} value={`t:${t}`}>
                {t}
              </option>
            ))}
          </optgroup>
        </select>
        <input type="hidden" name="service_type" value={serviceType} />
        {services.length === 0 && (
          <span className="block text-xs text-slate-400 mt-1">
            Set up your own price list in Settings → My services and it&apos;ll
            fill these in for you.
          </span>
        )}
      </label>

      {needsQuantity(picked) && (
        <label className="block text-sm">
          <span className="text-slate-600 font-medium">
            How many {unitFor(picked)}?
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={qty}
            onChange={onQty}
            placeholder={picked.pricing_type === "hourly" ? "3" : "2400"}
            className={fieldClass}
          />
          <span className="block text-xs text-slate-400 mt-1">
            {money(picked.price)} per {unitFor(picked).replace(/s$/, "")}
          </span>
        </label>
      )}

      <label className="block text-sm">
        <span className="text-slate-600 font-medium">Amount ($)</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="350.00"
          className={fieldClass}
        />
        {picked && picked.pricing_type === "range" && picked.price_max != null && (
          <span className="block text-xs text-slate-400 mt-1">
            You usually quote {money(picked.price)}–{money(picked.price_max)} for
            this.
          </span>
        )}
      </label>

      <div className="md:col-span-3">
        <label className="block text-sm">
          <span className="text-slate-600 font-medium">Notes</span>
          <span className="block text-xs text-slate-400">
            This is the &quot;what&apos;s included&quot; your customer reads on
            the estimate.
          </span>
          <textarea
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Soft wash of all siding, gutters, and trim. Includes pre-treatment and a rinse of windows and doors."
            className={fieldClass}
          />
        </label>
      </div>
    </>
  );
}
