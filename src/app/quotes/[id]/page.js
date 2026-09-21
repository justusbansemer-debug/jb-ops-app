import Link from "next/link";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, StatusPill, CardField } from "@/components/ui";
import ShareEstimate from "@/components/ShareEstimate";
import MapLinks from "@/components/MapLinks";

export const dynamic = "force-dynamic";

function when(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fullAddress(c) {
  if (!c) return "";
  const line2 = [c.city, c.state].filter(Boolean).join(", ");
  return [c.street_address, line2, c.zip].filter(Boolean).join(" ").trim();
}

const RESPONSE_LABEL = {
  accepted: "Accepted",
  declined: "Declined",
  change_requested: "Change requested",
};

const EVENT_LABEL = {
  viewed: "Opened the estimate",
  accepted: "Accepted the estimate",
  declined: "Declined the estimate",
  change_requested: "Asked for a change",
};

// One step of the little timeline at the top: Sent → Opened → Answered.
function Step({ done, title, detail, tone = "orange" }) {
  const dot = done
    ? tone === "green"
      ? "bg-green-600"
      : tone === "amber"
      ? "bg-amber-500"
      : tone === "slate"
      ? "bg-slate-400"
      : "bg-orange-600"
    : "bg-slate-200";
  return (
    <div className="flex items-start gap-3">
      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${done ? "" : "text-slate-400"}`}>
          {title}
        </p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export default async function QuoteDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote, error }, { data: events }] = await Promise.all([
    supabase.from("quotes").select("*, customers(*)").eq("id", id).maybeSingle(),
    supabase
      .from("quote_events")
      .select("*")
      .eq("quote_id", id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  if (error || !quote) {
    return (
      <div className="space-y-4">
        <Link href="/quotes" className="text-sm text-slate-500">
          ← Quotes
        </Link>
        <Card>
          <p className="text-slate-500 text-sm">
            That estimate couldn&apos;t be found.
          </p>
        </Card>
      </div>
    );
  }

  async function markSent() {
    "use server";
    const db = await createClient();
    await db
      .from("quotes")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", id);
    revalidatePath(`/quotes/${id}`);
    revalidatePath("/quotes");
  }

  const h = await headers();
  const host = h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const shareUrl = `${proto}://${host}/e/${quote.share_token}`;

  const c = quote.customers || null;
  const customerName = c ? [c.first_name, c.last_name].filter(Boolean).join(" ") : "—";
  const address = fullAddress(c);
  const response = quote.customer_response || null;

  return (
    <div className="space-y-6">
      <Link href="/quotes" className="text-sm text-slate-500">
        ← Quotes
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{quote.service_type}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {customerName}
            {quote.amount != null && ` · $${Number(quote.amount).toFixed(2)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusPill status={quote.status} />
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="text-slate-400 hover:text-orange-600 text-xs font-medium"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* What the customer said, if anything */}
      {response === "change_requested" && quote.change_request_note && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            They asked for a change
          </p>
          <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">
            {quote.change_request_note}
          </p>
          <p className="text-xs text-amber-700 mt-2">{when(quote.responded_at)}</p>
        </div>
      )}

      <Card title="Send this estimate">
        <ShareEstimate
          url={shareUrl}
          firstName={c?.first_name || ""}
          phone={c?.phone || ""}
          email={c?.email || ""}
          serviceType={quote.service_type}
          amount={quote.amount}
          businessName="J.B. Pressure Washing"
          markSent={markSent}
        />
      </Card>

      <Card title="Tracking">
        <div className="space-y-4">
          <Step
            done={!!quote.sent_at}
            title={quote.sent_at ? "Sent" : "Not sent yet"}
            detail={
              quote.sent_at
                ? when(quote.sent_at)
                : "Tap Text it or Email it above"
            }
          />
          <Step
            done={!!quote.first_viewed_at}
            title={quote.first_viewed_at ? "Opened" : "Not opened yet"}
            detail={
              quote.first_viewed_at
                ? `First opened ${when(quote.first_viewed_at)}` +
                  (quote.view_count > 1
                    ? ` · ${quote.view_count} opens, last ${when(
                        quote.last_viewed_at
                      )}`
                    : "")
                : "You'll see the time here the moment they tap the link"
            }
            tone="green"
          />
          <Step
            done={!!response}
            title={response ? RESPONSE_LABEL[response] : "No answer yet"}
            detail={
              response
                ? when(quote.responded_at)
                : "They can accept, decline, or ask for a change"
            }
            tone={
              response === "accepted"
                ? "green"
                : response === "declined"
                ? "slate"
                : "amber"
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Customer">
          {c ? (
            <div className="space-y-1">
              <Link
                href={`/customers/${c.id}`}
                className="font-semibold hover:text-orange-600"
              >
                {customerName}
              </Link>
              {c.company && (
                <p className="text-sm text-slate-500">{c.company}</p>
              )}
              {address && <p className="text-sm text-slate-600">{address}</p>}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                    className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    Call
                  </a>
                )}
                {c.phone && (
                  <a
                    href={`sms:${c.phone.replace(/[^\d+]/g, "")}`}
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
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No customer attached.</p>
          )}
        </Card>

        <Card title="Estimate details">
          <div className="space-y-1">
            <CardField label="Service" value={quote.service_type} />
            <CardField
              label="Amount"
              value={
                quote.amount != null ? `$${Number(quote.amount).toFixed(2)}` : null
              }
            />
            <CardField label="Status" value={quote.status} />
            <CardField label="Date" value={quote.date_sent} />
            <CardField label="Follow-up" value={quote.follow_up_date} />
          </div>
          {quote.notes && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap mt-3 pt-3 border-t border-slate-100">
              {quote.notes}
            </p>
          )}
        </Card>
      </div>

      <Card title="Activity">
        {!events || events.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Nothing yet — activity shows up here once you send the link.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((e) => (
              <li key={e.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">
                    {EVENT_LABEL[e.event_type] || e.event_type}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {when(e.created_at)}
                  </span>
                </div>
                {e.note && (
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {e.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
