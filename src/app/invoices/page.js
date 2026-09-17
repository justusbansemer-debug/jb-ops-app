import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Button, StatusPill, MobileCard, CardField } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

function paymentStatus(amount, paid) {
  const a = Number(amount || 0);
  const p = Number(paid || 0);
  if (p <= 0) return "Unpaid";
  if (p >= a) return "Paid";
  return "Partial";
}

async function addInvoice(formData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase.from("invoices").insert({
    customer_id: String(formData.get("customer_id") || "") || null,
    amount: Number(formData.get("amount") || 0) || 0,
    amount_paid: Number(formData.get("amount_paid") || 0) || 0,
    due_date: String(formData.get("due_date") || "") || null,
    payment_method: String(formData.get("payment_method") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    console.error("Failed to add invoice:", error.message);
    return;
  }

  revalidatePath("/invoices");
}

async function deleteInvoice(id) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete invoice:", error.message);
    return;
  }

  revalidatePath("/invoices");
}

export default async function InvoicesPage() {
  const supabase = await createClient();

  const [{ data: invoices, error }, { data: customers }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, customers(first_name, last_name, company)")
      .order("invoice_date", { ascending: false }),
    supabase.from("customers").select("id, first_name, last_name, company").order("first_name"),
  ]);

  const outstanding = (invoices || []).reduce(
    (sum, i) => sum + Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0),
    0
  );
  const collected = (invoices || []).reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-slate-500 text-sm mt-1">Bills sent after a job is done, and whether they&apos;ve been paid.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-sm text-slate-500 font-medium">Outstanding Balance</div>
          <div className="text-2xl font-bold mt-2">${outstanding.toFixed(2)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-sm text-slate-500 font-medium">Total Collected</div>
          <div className="text-2xl font-bold mt-2">${collected.toFixed(2)}</div>
        </div>
      </div>

      <Card title="Create an Invoice" id="add">
        <form action={addInvoice} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Input label="Amount ($)" name="amount" type="number" step="0.01" required />
          <Input label="Amount Paid ($)" name="amount_paid" type="number" step="0.01" />
          <Input label="Due Date" name="due_date" type="date" />
          <Input label="Payment Method" name="payment_method" placeholder="Cash, Zelle, Card…" />
          <div className="md:col-span-3">
            <Input label="Notes" name="notes" />
          </div>
          <div className="md:col-span-3">
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Card>

      <Card title={`All Invoices (${invoices?.length ?? 0})`}>
        {error && (
          <p className="text-red-600 text-sm">
            Could not load invoices yet — connect Supabase in .env.local to see real data here.
          </p>
        )}
        {!error && (!invoices || invoices.length === 0) && (
          <p className="text-slate-400 text-sm">No invoices yet — create your first one above.</p>
        )}
        {!error && invoices && invoices.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2 pr-4 text-right">Paid</th>
                    <th className="py-2 pr-4 text-right">Balance</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => {
                    const balance = Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0);
                    return (
                      <tr key={i.id} className="border-b border-slate-50">
                        <td className="py-3 pr-4 text-slate-600">{i.invoice_date}</td>
                        <td className="py-3 pr-4 font-semibold">
                          {i.customers ? `${i.customers.first_name} ${i.customers.last_name}` : "—"}
                        </td>
                        <td className="py-3 pr-4 text-right">${Number(i.amount).toFixed(2)}</td>
                        <td className="py-3 pr-4 text-right">${Number(i.amount_paid).toFixed(2)}</td>
                        <td className="py-3 pr-4 text-right font-semibold">${balance.toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          <StatusPill status={paymentStatus(i.amount, i.amount_paid)} />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/invoices/${i.id}/edit`}
                              className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                            >
                              Edit
                            </Link>
                            <DeleteButton action={deleteInvoice} id={i.id} label="invoice" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {invoices.map((i) => {
                const balance = Math.max(Number(i.amount || 0) - Number(i.amount_paid || 0), 0);
                return (
                  <MobileCard
                    key={i.id}
                    title={i.customers ? `${i.customers.first_name} ${i.customers.last_name}` : "—"}
                    subtitle={i.invoice_date}
                    topRight={<StatusPill status={paymentStatus(i.amount, i.amount_paid)} />}
                  >
                    <CardField label="Amount" value={`$${Number(i.amount).toFixed(2)}`} />
                    <CardField label="Paid" value={`$${Number(i.amount_paid).toFixed(2)}`} />
                    <CardField label="Balance" value={`$${balance.toFixed(2)}`} />
                    <div className="pt-1 flex items-center gap-4">
                      <Link
                        href={`/invoices/${i.id}/edit`}
                        className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                      >
                        Edit
                      </Link>
                      <DeleteButton action={deleteInvoice} id={i.id} label="invoice" />
                    </div>
                  </MobileCard>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
