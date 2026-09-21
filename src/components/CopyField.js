"use client";

// A long link with a Copy button, for things you paste somewhere else.
import { useState } from "react";

export default function CopyField({ value }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.target.select()}
        className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-mono bg-slate-50 text-slate-700"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
