"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// The raised "+" button in the middle of the bottom nav bar. Opens a small
// sheet linking straight to each entity's Add form (the form lives at the
// top of each list page, under id="add").
const actions = [
  { href: "/customers#add", label: "New Customer" },
  { href: "/jobs#add", label: "New Job" },
  { href: "/quotes#add", label: "New Quote" },
  { href: "/invoices#add", label: "New Invoice" },
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
          className="fixed inset-0 z-40 bg-slate-900/20"
        />
      )}

      {open && (
        <div className="absolute z-50 bottom-14 left-1/2 -translate-x-1/2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="block px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick add"
        aria-expanded={open}
        className={`relative z-50 -mt-6 w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg transition ${
          open ? "bg-red-500" : "bg-slate-900"
        }`}
      >
        <span className="text-white text-2xl leading-none font-light">{open ? "×" : "+"}</span>
      </button>
    </div>
  );
}
