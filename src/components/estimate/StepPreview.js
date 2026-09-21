"use client";

import { lineTotal, money, totals } from "./math";

// Step 4: the estimate exactly as the customer will see it.

export default function StepPreview({ business, customer, lines, value }) {
  const t = totals(lines, { discount: value.discount, taxRate: value.taxRate, deposit: value.deposit });
  const today = new Date().toLocaleDateString("en-US");
  const biz = business || {};
  const cust = customer || {};
  const custAddress = [cust.street_address, [cust.city, cust.state].filter(Boolean).join(", "), cust.zip]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">From</div>
          <div className="font-bold text-slate-900">{biz.business_name || "J.B. Pressure Washing"}</div>
          {biz.address && <div className="text-sm text-slate-500">{biz.address}</div>}
          {biz.phone && <div className="text-sm text-slate-500">{biz.phone}</div>}
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-900">ESTIMATE</div>
          <div className="text-sm text-slate-500">{today}</div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">To</div>
        <div className="font-semibold">
          {cust.first_name ? `${cust.first_name} ${cust.last_name}` : "No customer picked"}
        </div>
        {cust.phone && <div className="text-sm text-slate-500">{cust.phone}</div>}
        <div className="text-sm text-slate-500">{value.jobAddress || custAddress}</div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200 pb-2">
          <span>Services</span>
          <span>Amount</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {lines.map((i) => (
            <li key={i.key} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-slate-800">{i.name}</span>
                <span className="font-semibold">{money(lineTotal(i))}</span>
              </div>
              {i.notes && <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{i.notes}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1 text-sm border-t border-slate-200 pt-3">
        <div className="flex justify-between">
          <span className="text-slate-500">Subtotal</span>
          <span>{money(t.subtotal)}</span>
        </div>
        {Number(value.discount) > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-500">Discount</span>
            <span>−{money(value.discount)}</span>
          </div>
        )}
        {Number(value.taxRate) > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-500">Tax ({value.taxRate}%)</span>
            <span>{money(t.tax)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-1">
          <span>Total</span>
          <span>{money(t.total)}</span>
        </div>
        {Number(value.deposit) > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Deposit due now</span>
            <span>{money(value.deposit)}</span>
          </div>
        )}
      </div>

      {value.message && (
        <p className="text-sm text-slate-600 whitespace-pre-wrap border-t border-slate-200 pt-3">
          {value.message}
        </p>
      )}
    </div>
  );
}
