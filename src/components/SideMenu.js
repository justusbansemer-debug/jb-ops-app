"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Icon, ICONS } from "./SideMenuIcons";
import SideMenuHeader from "./SideMenuHeader";
import SideMenuLinks from "./SideMenuLinks";

// The slide-out drawer behind the hamburger in the top bar.

export default function SideMenu({ open, onClose }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-navy-900/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-11/12 max-w-[330px] bg-white shadow-2xl flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <SideMenuHeader onClose={onClose} />
        <SideMenuLinks pathname={pathname} expanded={expanded} setExpanded={setExpanded} />

        <div className="p-3 border-t border-slate-100">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              <Icon d={ICONS.out} className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
