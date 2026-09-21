"use client";

// The measuring tool itself. Type an address — or pull one off a customer —
// and go straight out to the map that measures it. No extra taps.
import { useMemo, useState } from "react";

const RECENTS_KEY = "jb-measure-recents";

const TARGETS = [
  {
    key: "earth",
    name: "Google Earth",
    blurb: "Best for square footage — ruler icon, then Area.",
    tone: "bg-green-600 hover:bg-green-700",
    href: (q) => `https://earth.google.com/web/search/${encodeURIComponent(q)}`,
  },
  {
    key: "maps",
    name: "Google Maps",
    blurb: "Satellite view. Press and hold a spot → Measure distance.",
    tone: "bg-blue-700 hover:bg-blue-800",
    href: (q) => `https://maps.google.com/?q=${encodeURIComponent(q)}&t=k&z=20`,
  },
  {
    key: "zillow",
    name: "Zillow",
    blurb: "Lot size and house square footage, already measured.",
    tone: "bg-indigo-600 hover:bg-indigo-700",
    href: (q) => `https://www.zillow.com/homes/${encodeURIComponent(q)}_rb/`,
  },
];

function addressOf(c) {
  const line2 = [c.city, c.state].filter(Boolean).join(", ");
  return [c.street_address, line2, c.zip].filter(Boolean).join(" ").trim();
}

function nameOf(c) {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || "";
}

function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecent(address) {
  try {
    const list = loadRecents().filter((a) => a !== address);
    list.unshift(address);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    // Private browsing or storage turned off — the tool still works.
  }
}

export default function MeasureTool({ customers = [] }) {
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [recents, setRecents] = useState(() =>
    typeof window === "undefined" ? [] : loadRecents()
  );

  const clean = address.trim();
  const ready = clean.length > 3;

  // Only customers who actually have an address to look up.
  const withAddress = useMemo(
    () => customers.filter((c) => addressOf(c)),
    [customers]
  );

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return [];
    return withAddress
      .filter((c) =>
        `${nameOf(c)} ${c.company || ""} ${addressOf(c)}`
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 6);
  }, [withAddress, search]);

  function pick(c) {
    setAddress(addressOf(c));
    setSearch("");
  }

  function go() {
    if (!ready) return;
    saveRecent(clean);
    setRecents(loadRecents());
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const field =
    "w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="space-y-5">
      {/* the address */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Address</span>
          <input
            type="text"
            inputMode="text"
            autoFocus
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="1706 Polk Ford Rd, Stanfield, NC 28163"
            className={`${field} mt-1`}
          />
        </label>

        {clean && (
          <button
            type="button"
            onClick={copy}
            className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-700"
          >
            {copied ? "Address copied ✓" : "Copy address"}
          </button>
        )}
      </div>

      {/* where to open it */}
      <div className="space-y-2">
        {TARGETS.map((t) =>
          ready ? (
            <a
              key={t.key}
              href={t.href(clean)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={go}
              className={`block rounded-xl px-4 py-4 text-white ${t.tone}`}
            >
              <span className="block font-semibold">Open in {t.name}</span>
              <span className="block text-xs opacity-90 mt-0.5">{t.blurb}</span>
            </a>
          ) : (
            <span
              key={t.key}
              className="block rounded-xl px-4 py-4 bg-slate-100 text-slate-400"
            >
              <span className="block font-semibold">Open in {t.name}</span>
              <span className="block text-xs mt-0.5">{t.blurb}</span>
            </span>
          )
        )}
        {!ready && (
          <p className="text-xs text-slate-400 px-1">
            Type an address above and these light up.
          </p>
        )}
      </div>

      {/* pull one off a customer */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-700">
          Or use a customer&apos;s address
        </h2>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your customers…"
          className={`${field} mt-2 text-sm`}
        />
        {search.trim() && (
          <div className="mt-2">
            {matches.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">
                No customer with an address matches that.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pick(c)}
                      className="w-full text-left py-2.5 group"
                    >
                      <span className="block text-sm font-semibold group-hover:text-orange-600">
                        {nameOf(c)}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {addressOf(c)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* what you looked up before */}
      {recents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Recently measured
          </h2>
          <ul className="divide-y divide-slate-100 mt-1">
            {recents.map((a) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => setAddress(a)}
                  className="w-full text-left py-2.5 text-sm text-slate-600 hover:text-orange-600"
                >
                  {a}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
