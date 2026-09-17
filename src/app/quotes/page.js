import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Select, Button, StatusPill, MobileCard, CardField } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

const SERVICE_TYPES = [
  "Soft Washing", "House Washing", "Roof Washing", "Driveway Cleaning",
  "Gutter Cleaning", "Gutter Whitening", "Window Cleaning", "Small Commercial",
  "Christmas Lights Install", "Christmas Lights Removal", "Other",
];
const QUOTE_STATUSES = ["Pending", "Accepted", "Declined", "Expired"];

async function addQuote(formData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase.from("quotes").insert({
    customer_id: String(formData.get("customer_id") || "") || null,
    service_type: String(formData.get("service_type") || ""),
    amount: Number(formData.get("amount") || 0) || null,
    status: String(formData.get("status") || "Pending"),
    follow_up_date: String(formData.get("follow_up_date") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    console.error("Failed to add quote:", error.message);
    return;
  }

  revalidatePath("/quotes");
}

async function deleteQuote(id) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete quote:", error.message);
    return;
  }

  revalidatePath("/quotes");
}

export default async function QuotesPage() {
  const supabase = await createClient();

  const [{ data: quotes, error }, { data: customers }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*, customers(first_name, last_name, company)")
      .order("date_sent", { ascending: false }),
    supabase.from("customers").select("id, first_name, last_name, company").order("first_name"),
  ]);

  const pendingValue = (quotes || [])
    .filter((q) => q.status === "Pending")
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quotes</h1>
        <p className="text-slate-500 text-sm mt-1">Estimates sent to customers, before a job is booked.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-xs">
        <div className="text-sm text-slate-500 font-medium">Pending Value</div>
        <div className="text-2xl font-bold mt-2">${pendingValue.toFixed(2)}</div>
      </div>

      <Card title="Send a Quote">
        <form action={addQuote} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Customer</span>
            <select
              name="customer_id"
              required
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Select a customer…</option>
              {(customers || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                  {c.company ? ` (${c.company})` : ""}
                </option>
              ))}
            </select>
          </label>
          <Select label="Service Type" name="service_type" options={SERVICE_TYPES} />
          <Input label="Amount ($)" name="amount" type="number" step="0.01" required />
          <Select label="Status" name="status" options={QUOTE_STATUSES} />
          <Input label="Follow-up Date" name="follow_up_date" type="date" />
          <div className="md:col-span-3">
            <Input label="Notes" name="notes" />
          </div>
          <div className="md:col-span-3">
            <Button type="submit">Add Quote</Button>
          </div>
        </form>
      </Card>

      <Card title={`All Quotes (${quotes?.length ?? 0})`}>
        {error && (
          <p className="text-red-600 text-sm">
            Could not load quotes yet — connect Supabase in .env.local to see real data here.
          </p>
        )}
        {!error && (!quotes || quotes.length === 0) && (
          <p className="text-slate-400 text-sm">No quotes yet — send your first one above.</p>
        )}
        {!error && quotes && quotes.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                    <th className="py-2 pr-4">Sent</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Service</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Follow-up</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b border-slate-50">
                      <td className="py-3 pr-4 text-slate-600">{q.date_sent}</td>
                      <td className="py-3 pr-4 font-semibold">
                        {q.customers ? `${q.customers.first_name} ${q.customers.last_name}` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{q.service_type}</td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {q.amount != null ? `$${Number(q.amount).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill status={q.status} />
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{q.follow_up_date || "—"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/quotes/${q.id}/edit`}
                            className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                          >
                            Edit
                          </Link>
                          <DeleteButton action={deleteQuote} id={q.id} label="quote" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {quotes.map((q) => (
                <MobileCard
                  key={q.id}
                  title={q.customers ? `${q.customers.first_name} ${q.customers.last_name}` : "—"}
                  subtitle={q.service_type}
                  topRight={<StatusPill status={q.status} />}
                >
                  <CardField label="Sent" value={q.date_sent} />
                  <CardField
                    label="Amount"
                    value={q.amount != null ? `$${Number(q.amount).toFixed(2)}` : null}
                  />
                  <CardField label="Follow-up" value={q.follow_up_date} />
                  <div className="pt-1 flex items-center gap-4">
                    <Link
                      href={`/quotes/${q.id}/edit`}
                      className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                    >
                      Edit
                    </Link>
                    <DeleteButton action={deleteQuote} id={q.id} label="quote" />
                  </div>
                </MobileCard>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
