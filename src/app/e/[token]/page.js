// The page your customer sees when they tap the estimate link you sent.
// No login — they're not a user of the app. It reads the one estimate that
// token belongs to through a locked-down database function, and nothing else.
import { createClient } from "@supabase/supabase-js";
import EstimateActions from "./EstimateActions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FALLBACK_NAME = "J.B. Pressure Washing";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function longDate(v) {
  if (!v) return null;
  // Dates come back as plain YYYY-MM-DD, which JS would otherwise read as UTC
  // and show a day early in Eastern time.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(v))
    ? new Date(`${v}T12:00:00`)
    : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fullAddress(c) {
  if (!c) return "";
  const line2 = [c.city, c.state].filter(Boolean).join(", ");
  return [c.street_address, line2, c.zip].filter(Boolean).join(" ").trim();
}

function Frame({ children }) {
  return <div className="mx-auto w-full max-w-lg">{children}</div>;
}

function NotFound({ biz }) {
  const name = biz?.business_name || FALLBACK_NAME;
  const phone = biz?.phone || "";
  return (
    <Frame>
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-lg font-bold">This estimate link isn&apos;t valid</h1>
        <p className="text-sm text-slate-500 mt-2">
          The link may have been mistyped, or this estimate may have been
          replaced. Get in touch with {name} and we&apos;ll send a fresh one.
        </p>
        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-block mt-5 bg-orange-600 text-white font-semibold text-sm px-5 py-3 rounded-lg"
          >
            Call {phone}
          </a>
        )}
      </div>
    </Frame>
  );
}

export default async function PublicEstimatePage({ params }) {
  const { token } = await params;

  if (!token || !UUID_RE.test(token)) return <NotFound />;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return <NotFound />;

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("get_public_quote", {
    p_token: token,
  });

  if (error || !data || !data.quote) return <NotFound biz={data?.business} />;

  const q = data.quote;
  const items = Array.isArray(data.items) ? data.items : [];
  const customer = data.customer || {};
  const biz = data.business || {};

  const bizName = biz.business_name || FALLBACK_NAME;
  const bizPhone = biz.phone || "";
  const bizEmail = biz.email || "";
  const bizFooter = biz.estimate_footer || "";

  const customerName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ");
  const address = fullAddress(customer);
  const amountText = money(q.amount);
  const ref = String(q.id || "").slice(0, 8).toUpperCase();

  return (
    <Frame>
      {/* Who it's from */}
      <div className="text-center mb-4">
        <p className="text-xl font-bold">{bizName}</p>
        <p className="text-sm text-slate-500 mt-1">
          Estimate{ref ? ` #${ref}` : ""}
        </p>
      </div>

      {/* The estimate */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
            Your estimate
          </p>
          <h1 className="text-lg font-bold mt-1">{q.service_type}</h1>
          {amountText && (
            <p className="text-3xl font-bold mt-3">{amountText}</p>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {items.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                What&apos;s included
              </p>
              <ul className="mt-2 divide-y divide-slate-100">
                {items.map((it) => (
                  <li key={it.id} className="py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold">{it.name}</span>
                      <span className="text-sm font-semibold">{money(it.amount)}</span>
                    </div>
                    {it.notes && (
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{it.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
              {Number(q.discount) > 0 && (
                <p className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>Discount</span>
                  <span>-{money(q.discount)}</span>
                </p>
              )}
              {Number(q.tax_rate) > 0 && (
                <p className="flex justify-between text-sm text-slate-600 mt-1">
                  <span>Tax ({q.tax_rate}%)</span>
                  <span>included above</span>
                </p>
              )}
              {Number(q.deposit) > 0 && (
                <p className="flex justify-between text-sm text-slate-600 mt-1">
                  <span>Deposit to book</span>
                  <span>{money(q.deposit)}</span>
                </p>
              )}
            </div>
          )}

          {(customerName || address) && (
            <div className="px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Prepared for
              </p>
              {customerName && (
                <p className="text-sm font-semibold mt-1">{customerName}</p>
              )}
              {customer.company && (
                <p className="text-sm text-slate-600">{customer.company}</p>
              )}
              {address && (
                <p className="text-sm text-slate-600 mt-1">{address}</p>
              )}
            </div>
          )}

          {q.notes && (
            <div className="px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                What&apos;s included
              </p>
              <p className="text-sm text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap">
                {q.notes}
              </p>
            </div>
          )}

          {longDate(q.date_sent) && (
            <div className="px-5 py-4 text-sm text-slate-600">
              <p>Estimate date {longDate(q.date_sent)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Accept / Request a change / Decline */}
      <EstimateActions
        token={token}
        initialResponse={q.customer_response}
        termsText={q.terms_text}
      />

      {/* How to reach you */}
      <div className="text-center text-sm text-slate-500 mt-6">
        <p>Questions? Reach out any time.</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {bizPhone && (
            <a
              className="font-semibold text-slate-700 underline"
              href={`tel:${bizPhone.replace(/[^\d+]/g, "")}`}
            >
              {bizPhone}
            </a>
          )}
          {bizEmail && (
            <a
              className="font-semibold text-slate-700 underline"
              href={`mailto:${bizEmail}`}
            >
              {bizEmail}
            </a>
          )}
        </p>
        {bizFooter && (
          <p className="text-xs text-slate-500 leading-relaxed mt-4 whitespace-pre-wrap">
            {bizFooter}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-4">{bizName}</p>
      </div>
    </Frame>
  );
}
