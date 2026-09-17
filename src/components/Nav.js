import Link from "next/link";
import { logout } from "@/app/login/actions";

// The top navigation bar shown on every page (except the login screen).
const links = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/jobs", label: "Jobs" },
  { href: "/quotes", label: "Quotes" },
  { href: "/invoices", label: "Invoices" },
];

export default function Nav() {
  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-lg">J.B. Pressure Washing — Ops</div>
        <div className="flex items-center gap-6 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-orange-400">
              {l.label}
            </Link>
          ))}
          <form action={logout}>
            <button type="submit" className="text-slate-400 hover:text-white">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
