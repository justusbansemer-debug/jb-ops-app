"use client";

// The Service / Edit / Preview strip across the top of the wizard.

const STEPS = ["Customer", "Services", "Edit", "Preview"];

export default function StepTabs({ step, onGo }) {
  return (
    <div className="flex border-b border-slate-200 bg-white sticky top-14 z-20">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <button
            key={label}
            type="button"
            onClick={() => (done ? onGo(i) : null)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              active
                ? "border-blue-600 text-blue-700"
                : done
                ? "border-transparent text-slate-600"
                : "border-transparent text-slate-300"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
