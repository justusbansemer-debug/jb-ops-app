"use client";

import { lineTotal, money, totals } from "./math";

// Step 3: what's on the estimate and what it comes to — discount, tax,
// deposit, and the message the customer reads.

const box =
  "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500";

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </div>
  );
}

export default function StepEdit({ lines, value, onChange, terms }) {
  const t = totals(lines, { discount: value.discount, taxRate: value.taxRate, deposit: value.deposit });

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          Services
        </div>
        <ul className="divide-y divide-slate-100 px-4">
          {lines.map((i) => (
            <li key={i.key} className="py-3 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{i.name}</span>
              <span className="font-semibold">{money(lineTotal(i))}</span>
            </li>
          ))}
          {lines.length === 0 && (
            <li className="py-3 text-sm text-slate-400">Nothing added yet — go back a step.</li>
          )}
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          Totals
        </div>
        <div className="p-4 divide-y divide-slate-100">
          <Row label="Subtotal">
            <span className="font-semibold">{money(t.subtotal)}</span>
          </Row>
          <Row label="Discount $">
            <input
              inputMode="decimal"
              value={value.discount}
              onChange={(e) => onChange({ ...value, discount: e.target.value })}
              placeholder="0.00"
              className={`${box} max-w-[130px]`}
            />
          </Row>
          <Row label="Tax rate %">
            <input
              inputMode="decimal"
              value={value.taxRate}
              onChange={(e) => onChange({ ...value, taxRate: e.target.value })}
              placeholder="0"
              className={`${box} max-w-[130px]`}
            />
          </Row>
          <Row label="Deposit $">
            <input
              inputMode="decimal"
              value={value.deposit}
              onChange={(e) => onChange({ ...value, deposit: e.target.value })}
              placeholder="0.00"
              className={`${box} max-w-[130px]`}
            />
          </Row>
          <Row label="Total">
            <span className="text-lg font-bold">{money(t.total)}</span>
          </Row>
          {Number(value.deposit) > 0 && (
            <Row label="Due after deposit">
              <span className="font-semibold">{money(t.balance)}</span>
            </Row>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          Message and terms
        </div>
        <div className="p-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-500">Message to the customer</span>
            <textarea
              rows={3}
              value={value.message}
              onChange={(e) => onChange({ ...value, message: e.target.value })}
              placeholder="Thanks for having us out — here's what we'd do."
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {terms.length > 0 && (
            <label className="block text-sm">
              <span className="text-slate-500">Terms &amp; conditions</span>
              <select
                value={value.termsId}
                onChange={(e) => onChange({ ...value, termsId: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {terms.map((t2) => (
                  <option key={t2.id} value={t2.id}>
                    {t2.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm">
            <span className="text-slate-500">Follow up on</span>
            <input
              type="date"
              value={value.followUp}
              onChange={(e) => onChange({ ...value, followUp: e.target.value })}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
