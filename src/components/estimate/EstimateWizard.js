"use client";

import { useState } from "react";
import StepTabs from "./StepTabs";
import StepCustomer from "./StepCustomer";
import StepServices from "./StepServices";
import StepEdit from "./StepEdit";
import StepPreview from "./StepPreview";
import SaveSheet from "./SaveSheet";
import { lineTotal, money, totals } from "./math";

// Four steps: who it's for, what you're doing, what it costs, what they see.

function blankLine(s) {
  return {
    key: s.id,
    included: false,
    service_id: s.id,
    name: s.name,
    pricing_type: s.pricing_type || "flat",
    unit_label: s.unit_label || "",
    base_price: s.price != null ? String(s.price) : "",
    unit_price: s.price != null ? String(s.price) : "",
    quantity: "",
    flat: "",
    notes: s.default_notes || "",
  };
}

export default function EstimateWizard({ customers, services, terms, business, createEstimate }) {
  const [step, setStep] = useState(0);
  const [who, setWho] = useState({ customerId: "", jobAddress: "" });
  const [lines, setLines] = useState(() => (services || []).map(blankLine));
  const [money_, setMoney] = useState({
    discount: "",
    taxRate: "",
    deposit: "",
    message: "",
    termsId: "",
    followUp: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  const chosen = lines.filter((l) => l.included && lineTotal(l) > 0);
  const customer = customers.find((c) => c.id === who.customerId) || null;
  const t = totals(chosen, {
    discount: money_.discount,
    taxRate: money_.taxRate,
    deposit: money_.deposit,
  });

  function addCustom() {
    const key = `custom-${Date.now()}`;
    const name = window.prompt("What's the service called?");
    if (!name) return;
    setLines([
      { key, included: true, service_id: null, name, pricing_type: "flat", unit_label: "", base_price: "", unit_price: "", quantity: "", flat: "", notes: "" },
      ...lines,
    ]);
  }

  function next() {
    setError("");
    if (step === 0 && !who.customerId) return setError("Pick a customer first.");
    if (step === 1 && chosen.length === 0) return setError("Put a price on at least one service.");
    setStep(Math.min(step + 1, 3));
    window.scrollTo(0, 0);
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await createEstimate({
      customerId: who.customerId,
      jobAddress: who.jobAddress,
      discount: money_.discount,
      taxRate: money_.taxRate,
      deposit: money_.deposit,
      message: money_.message,
      termsId: money_.termsId,
      followUp: money_.followUp,
      items: chosen.map((l, idx) => ({
        service_id: l.service_id,
        name: l.name,
        pricing_type: l.pricing_type,
        unit_label: l.unit_label,
        unit_price: l.unit_price === "" ? null : Number(l.unit_price),
        quantity: l.quantity === "" ? null : Number(l.quantity),
        amount: lineTotal(l),
        notes: l.notes || null,
        sort_order: idx,
      })),
    });
    setSaving(false);
    if (res?.error) return setError(res.error);
    setSaved(res);
  }

  function startOver() {
    setSaved(null);
    setStep(0);
    setWho({ customerId: "", jobAddress: "" });
    setLines((services || []).map(blankLine));
    setMoney({ discount: "", taxRate: "", deposit: "", message: "", termsId: "", followUp: "" });
    window.scrollTo(0, 0);
  }

  return (
    <div className="pb-28">
      <StepTabs step={step} onGo={setStep} />

      <div className="pt-4 space-y-4">
        {step === 0 && <StepCustomer customers={customers} value={who} onChange={setWho} />}
        {step === 1 && <StepServices items={lines} onChange={setLines} onAddCustom={addCustom} />}
        {step === 2 && (
          <StepEdit lines={chosen} value={money_} onChange={setMoney} terms={terms || []} />
        )}
        {step === 3 && (
          <StepPreview business={business} customer={customer} lines={chosen} value={{ ...money_, jobAddress: who.jobAddress }} />
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="fixed bottom-16 lg:bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600"
            >
              Back
            </button>
          )}
          <div className="flex-1 text-sm text-slate-500">
            {chosen.length > 0 && <span className="font-bold text-slate-900">{money(t.total)}</span>}
          </div>
          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold"
            >
              {saving ? "Saving…" : "Save estimate"}
            </button>
          )}
        </div>
      </div>

      {saved && (
        <SaveSheet
          quoteId={saved.id}
          shareUrl={saved.shareUrl}
          customer={customer}
          total={t.total}
          onNew={startOver}
        />
      )}
    </div>
  );
}
