"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import QuickAddButton from "./QuickAddButton";

// The navigation shown on every page except the login screen: a slim top
// bar everywhere, plus a QuoteIQ-style bottom tab bar on phones/tablets
// (the horizontal link row moves into the top bar once there's room, on
// large screens). The bottom bar also carries a raised "+" quick-add
// button in the middle, matching the reference layout.
const links = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/customers", label: "Customers", icon: UsersIcon },
  { href: "/jobs", label: "Jobs", icon: JobsIcon },
  { href: "/quotes", label: "Quotes", icon: QuoteIcon },
  { href: "/invoices", label: "Invoices", icon: InvoiceIcon },
];

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      <path d="M16 8.5a3 3 0 1 1 3.2 3" />
      <path d="M15.5 14a6.5 6.5 0 0 1 6 5.5" />
    </svg>
  );
}

function JobsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function QuoteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function InvoiceIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function NavLink({ link, active }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
        active ? "text-orange-600" : "text-slate-500"
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? "text-orange-600" : "text-slate-400"}`} />
      {link.label}
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="font-bold text-base sm:text-lg leading-tight">
            J.B. Pressure Washing
            <span className="hidden sm:inline text-slate-400 font-normal"> — Ops</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={active ? "text-orange-400" : "text-slate-200 hover:text-orange-400"}
                >
                  {l.label}
                </Link>
              );
            })}
            <form action={logout}>
              <button type="submit" className="text-slate-400 hover:text-white">
                Sign Out
              </button>
            </form>
          </div>

          <form action={logout} className="lg:hidden">
            <button type="submit" className="text-slate-400 hover:text-white text-xs font-medium">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          <NavLink link={links[0]} active={pathname === links[0].href} />
          <NavLink link={links[1]} active={pathname === links[1].href} />
          <QuickAddButton />
          <NavLink link={links[2]} active={pathname === links[2].href} />
          <NavLink link={links[3]} active={pathname === links[3].href} />
          <NavLink link={links[4]} active={pathname === links[4].href} />
        </div>
      </nav>
    </>
  );
}
