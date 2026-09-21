"use client";

import Link from "next/link";
import { Chevron, Icon, ICONS } from "./SideMenuIcons";
import { GROUPS } from "./SideMenuGroups";

// Dashboard plus the expandable groups inside the menu drawer.

export default function SideMenuLinks({ pathname, expanded, setExpanded }) {
  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <Link
        href="/"
        className={`flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-[15px] ${
          pathname === "/" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Icon d={ICONS.home} />
        Dashboard
      </Link>

      {GROUPS.map((g) => {
        const isOpen = expanded === g.key;
        return (
          <div key={g.key}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : g.key)}
              aria-expanded={isOpen}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-[15px] ${
                g.accent ? "text-blue-700 hover:bg-blue-50" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon d={g.icon} />
              <span className="flex-1 text-left">{g.label}</span>
              <Chevron open={isOpen} />
            </button>

            {isOpen && (
              <div className="pb-2 pl-11 pr-3 space-y-0.5">
                {g.items.map((i) => (
                  <Link
                    key={i.href + i.label}
                    href={i.href}
                    className={`block px-3 py-2.5 rounded-lg text-sm ${
                      pathname === i.href
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
