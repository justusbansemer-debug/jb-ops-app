import Link from "next/link";

const ITEMS = [
  {
    href: "/settings/services",
    title: "My services",
    sub: "Build your own price list — you set up each one exactly how you want it",
  },
  {
    href: "/settings/terms",
    title: "Terms & conditions",
    sub: "Write the agreements you attach to an estimate — customers sign them on the link",
  },
  {
    href: "/settings/calendar",
    title: "Google Calendar",
    sub: "Subscribe once — every job you schedule lands on your calendar",
  },
  {
    href: "/settings/business",
    title: "Business info",
    sub: "Your name, phone, and email as customers see them on an estimate",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          How the app works for you and what your customers see.
        </p>
      </div>

      <div className="space-y-2">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-4 hover:border-orange-300 hover:bg-orange-50/40"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-sm">{item.title}</span>
              <span className="block text-xs text-slate-500">{item.sub}</span>
            </span>
            <span className="text-slate-300 shrink-0" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
