"use client";

// The map pin. Tap it next to any address and pick where to open it —
// each one lands on that exact property, ready to measure.
import { useEffect, useState } from "react";

function targets(address) {
  const q = encodeURIComponent(address);
  return [
    {
      key: "maps",
      name: "Google Maps",
      tip: "Satellite view. To measure: press and hold a spot → Measure distance.",
      href: `https://maps.google.com/?q=${q}&t=k&z=20`,
      tone: "bg-blue-50 text-blue-700",
      icon: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
    },
    {
      key: "earth",
      name: "Google Earth",
      tip: "Best measuring tool — the ruler icon, then Area for square footage.",
      href: `https://earth.google.com/web/search/${q}`,
      tone: "bg-green-50 text-green-700",
      icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.1c.7 1 1.4 2.6 1.8 4.9h-3.6c.4-2.3 1.1-3.9 1.8-4.9ZM4.3 14a8 8 0 0 1 0-4h3.3a20 20 0 0 0 0 4Zm.8 2h2.9c.3 1.4.7 2.7 1.2 3.8A8 8 0 0 1 5.1 16Zm2.9-8H5.1a8 8 0 0 1 4.1-3.8C8.7 5.3 8.3 6.6 8 8Zm4 11.9c-.7-1-1.4-2.6-1.8-4.9h3.6c-.4 2.3-1.1 3.9-1.8 4.9Zm2.2-6.9H9.8a18 18 0 0 1 0-4h4.4a18 18 0 0 1 0 4Zm.6 6.7c.5-1.1.9-2.4 1.2-3.8h2.9a8 8 0 0 1-4.1 3.8ZM16.4 14a20 20 0 0 0 0-4h3.3a8 8 0 0 1 0 4Zm-.6-6a15.6 15.6 0 0 0-1.2-3.8A8 8 0 0 1 18.9 8Z",
    },
    {
      key: "zillow",
      name: "Zillow",
      tip: "Lot size and house square footage, already measured for you.",
      href: `https://www.zillow.com/homes/${q}_rb/`,
      tone: "bg-indigo-50 text-indigo-700",
      icon: "M12 3 2 10.2V21h7v-6h6v6h7V10.2L12 3Z",
    },
  ];
}

export default function MapLinks({ address, label, className }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const clean = (address || "").trim();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!clean) return null;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open this address in maps"
        className={
          className ||
          "inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg"
        }
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        {label === null ? null : <span>{label || "Map"}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-xl sm:rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-lg">Measure this property</h2>
                <p className="text-sm text-slate-500 truncate">{clean}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-700 text-xl leading-none px-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {targets(clean).map((t) => (
                <a
                  key={t.key}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 border border-slate-200 rounded-lg p-3 hover:bg-slate-50"
                >
                  <span
                    className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${t.tone}`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path d={t.icon} />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-sm">{t.name}</span>
                    <span className="block text-xs text-slate-500 leading-relaxed mt-0.5">
                      {t.tip}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={copyAddress}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-3 rounded-lg mt-3"
            >
              {copied ? "Address copied ✓" : "Copy address"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
