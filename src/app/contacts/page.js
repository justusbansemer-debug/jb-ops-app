import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import MapLinks from "@/components/MapLinks";

export const dynamic = "force-dynamic";

function fullAddress(c) {
  const line2 = [c.city, c.state].filter(Boolean).join(", ");
  return [c.street_address, line2, c.zip].filter(Boolean).join(" ").trim();
}

function initials(c) {
  return (
    `${(c.first_name || "")[0] || ""}${(c.last_name || "")[0] || ""}`.toUpperCase() ||
    "?"
  );
}

function digits(v) {
  return (v || "").replace(/[^\d+]/g, "");
}

export default async function ContactsPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q || "").trim();

  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("first_name", { ascending: true });

  const needle = q.toLowerCase();
  const rows = !needle
    ? customers || []
    : (customers || []).filter((c) =>
        [
          c.first_name,
          c.last_name,
          c.company,
          c.phone,
          c.email,
          c.street_address,
          c.city,
          c.zip,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact list</h1>
        <p className="text-slate-500 text-sm mt-1">
          Everyone you work with — one tap to call, text, email, or pull up
          their property.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, company, phone, address…"
          className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg"
        >
          Search
        </button>
        {q && (
          <Link
            href="/contacts"
            className="px-4 py-2.5 text-sm font-medium text-slate-500"
          >
            Clear
          </Link>
        )}
      </form>

      <Card title={`Contacts (${rows.length})`}>
        {error && (
          <p className="text-red-600 text-sm">
            Could not load contacts — check the Supabase connection.
          </p>
        )}
        {!error && rows.length === 0 && (
          <p className="text-slate-400 text-sm">
            {q ? "No matches." : "No customers yet — add one first."}
          </p>
        )}
        {!error && rows.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {rows.map((c) => {
              const address = fullAddress(c);
              return (
                <li key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center">
                      {initials(c)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-semibold truncate block hover:text-orange-600"
                      >
                        {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                          "Unnamed"}
                      </Link>
                      {c.company && (
                        <p className="text-xs text-slate-400 truncate">
                          {c.company}
                        </p>
                      )}
                      {address && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5 pl-13">
                    {c.phone && (
                      <a
                        href={`tel:${digits(c.phone)}`}
                        className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        Call
                      </a>
                    )}
                    {c.phone && (
                      <a
                        href={`sms:${digits(c.phone)}`}
                        className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        Text
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        Email
                      </a>
                    )}
                    <MapLinks address={address} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
