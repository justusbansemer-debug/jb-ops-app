"use client";

import { useState, useTransition } from "react";

// A small delete control that requires a second tap before it actually
// deletes anything — avoids native confirm() popups (which look bad on
// mobile) while still preventing accidental taps.
export default function DeleteButton({ action, id, label = "item" }) {
  const [armed, setArmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-slate-400 hover:text-red-600 text-xs font-medium"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
      <span className="text-red-600 font-medium">Delete this {label}?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => action(id))}
        className="text-red-600 font-semibold hover:underline disabled:opacity-50"
      >
        {isPending ? "…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-slate-400 hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}
