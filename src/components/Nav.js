"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import QuickAddButton from "./QuickAddButton";
import SideMenu from "./SideMenu";

// The app chrome: a light top bar with the hamburger (opens the full menu
// drawer) on every screen size, and on phones a bottom tab bar with the
// raised "+" in the middle. Desktop gets a row of the main links in the
// top bar as well.

const TOP_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/jobs", label: "Jobs" },
  { href: "/quotes", label: "Estimates" },
  { href: "/invoices", label: "Invoices" },
  { href: "/today", label: "Today" },
  { href: "/menu", label: "Menu" },
];

// The five phone tabs. "+" sits between index 1 and 2.
const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/quotes", label: "Estimates", icon: EstimateIcon },
  { href: "/today", label: "Schedule", icon: ScheduleIcon },
  { href: "/menu", label: "More", icon: MoreIcon },
];

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function EstimateIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function ScheduleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14l2 2 4-4" />
    </svg>
  );
}

function MoreIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function Tab({ link, active }) {
  const TabIcon = link.icon;
  return (
    <Link
      href={link.href}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold ${
        active ? "text-blue-700" : "text-slate-500"
      }`}
    >
      <TabIcon className={`w-[22px] h-[22px] ${active ? "text-blue-700" : "text-slate-400"}`} />
      {link.label}
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-navy-800 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/" className="font-bold text-navy-900 text-[17px] sm:text-lg leading-none truncate">
            J.B. Pressure Washing
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium ml-auto">
            {TOP_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={active ? "text-blue-700 font-semibold" : "text-slate-500 hover:text-blue-700"}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <SideMenu open={menuOpen} onClose={closeMenu} />

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          <Tab link={TABS[0]} active={pathname === TABS[0].href} />
          <Tab link={TABS[1]} active={pathname === TABS[1].href} />
          <QuickAddButton />
          <Tab link={TABS[2]} active={pathname === TABS[2].href} />
          <Tab link={TABS[3]} active={pathname === TABS[3].href} />
        </div>
      </nav>
    </>
  );
}


// The slide-out drawer behind the hamburger in the top bar. Everything in
// the app is reachable from here, grouped the way you'd look for it, so no
// page is ever more than two taps away.
