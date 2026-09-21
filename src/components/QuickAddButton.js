"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// The raised "+" in the middle of the bottom bar. Tapping it slides a
// full-width sheet up over the bar with every "new thing" in one list, and
// the button itself turns into a red X to close it.

function ActionIcon({ d }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 text-blue-700 shrink-0"
    >
      {d}
    </svg>
  );
}

const ACTIONS = [
  {
    href: "/customers#add",
    label: "New Customer",
    icon: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  },
  {
    href: "/quotes/new",
    label: "New Estimate",
    icon: <><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5" /><path d="M8 13h8M8 17h5" /></>,
  },
  {
    href: "/jobs#add",
    label: "New Job",
    icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
  },
  {
    href: "/invoices#add",
    label: "New Invoice",
    icon: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  },
  {
    href: "/menu",
    label: "Measure a Property",
    icon: <><path d="m9 3 6 2 6-2v16l-6 2-6-2-6 2V5Z" /><path d="M9 3v16M15 5v16" /></>,
  },
  {
    href: "/contacts",
    label: "Contact List",
    icon: <><path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5Z" /><circle cx="12" cy="10" r="2.2" /><path d="M8.5 16a3.8 3.8 0 0 1 7 0" /><path d="M3 7h2M3 12h2M3 17h2" /></>,
  },
];

export default function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex justify-center">
      {open && (
        <button
          type="button"
          aria-label="Close quick actions"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-navy-900/30"
        />
      )}

      {open && (
        <div className="fixed z-50 inset-x-0 bottom-[68px] px-3 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {ACTIONS.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-[15px] font-medium text-slate-700 active:bg-slate-100 border-b border-slate-100 last:border-0"
              >
                <ActionIcon d={a.icon} />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close quick actions" : "Quick add"}
        aria-expanded={open}
        className={`relative z-50 -mt-6 w-[54px] h-[54px] rounded-full flex items-center justify-center shadow-lg transition ${
          open ? "bg-red-500" : "bg-blue-700"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-6 h-6 text-white">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M12 5v14M5 12h14" />}
        </svg>
      </button>
    </div>
  );
}
