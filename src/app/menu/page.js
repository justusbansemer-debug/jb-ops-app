"use client";

// The "everything" page — every part of the app in one place, plus a box
// to pull up any property on a map whether or not they're a customer yet.
import Link from "next/link";
import { useState } from "react";
import MapLinks from "@/components/MapLinks";

const SECTIONS = [
  {
    title: "Day to day",
    items: [
      { href: "/", label: "Dashboard", sub: "Sales and activity" },
      { href: "/today", label: "Today", sub: "Jobs on deck" },
      { href: "/jobs", label: "Jobs", sub: "Schedule and status" },
      { href: "/measure", label: "Measure a property", sub: "Satellite and lot size" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/customers", label: "Customers", sub: "Full records" },
      { href: "/contacts", label: "Contact list", sub: "Call, text, map" },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/quotes", label: "Estimates", sub: "Send and track" },
      { href: "/invoices", label: "Invoices", sub: "Billed and paid" },
    ],
  },
  {
    title: "Setup",
    items: [
      { href: "/settings/services", label: "My services", sub: "Your own price list" },
      { href: "/settings/business", label: "Business info", sub: "Shown on estimates" },
      { href: "/settings", label: "Settings", sub: "Everything else" },
    ],
  },
];

const QUICK = [
  { href: "/quotes#add", label: "New estimate" },
  { href: "/customers#add", label: "New customer" },
  { href: "/jobs#add", label: "New job" },
  { href: "/invoices#add", label: "New invoice" },
];

export default function MenuPage() {
  const [address, setAddress] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="text-slate-500 text-sm mt-1">Everything, in one place.</p>
      </div>

      {/* Measure any property */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <h2 className="font-semibold text-lg">Measure a property</h2>
        <p className="text-sm text-slate-500 mt-1">
          Type any address and jump straight to it in Google Maps, Google
          Earth, or Zillow — each one ready to measure.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Stanfield, NC"
            className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {address.trim() ? (
            <MapLinks
              address={address}
              label="Open maps"
              className="inline-flex items-center justify-center gap-2 shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
            />
          ) : (
            <span className="inline-flex items-center justify-center shrink-0 bg-slate-100 text-slate-400 font-semibold text-sm px-5 py-2.5 rounded-lg">
              Open maps
            </span>
          )}
        </div>
      </div>

      {/* Quick add */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-3 py-3 rounded-lg text-center truncate"
          >
            + {a.label}
          </Link>
        ))}
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-1">
            {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-orange-300 hover:bg-orange-50/40"
              >
                <span className="block font-semibold text-sm">{item.label}</span>
                <span className="block text-xs text-slate-500 truncate">
                  {item.sub}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
