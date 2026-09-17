import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Button } from "@/components/ui";
import CustomerPicker from "@/components/CustomerPicker";

async function updateInvoice(formData) {
  "use server";

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({
      customer_id: String(formData.get("customer_id") || "") || null,
      amount: Number(formData.get("amount") || 0) || 0,
      amount_paid: Number(formData.get("amount_paid") || 0) || 0,
      due_date: String(formData.get("due_date") || "") || null,
      payment_method: String(formData.get("payment_method") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update invoice:", error.message);
    return;
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export default async function EditInvoicePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: customers }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("customers").select("id, first_name, last_name, company").order("first_name"),
  ]);

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
      </div>

      <Card>
        <form action={updateInvoice} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="hidden" name="id" value={invoice.id} />
          <div className="block text-sm">
            <span className="text-slate-600 font-medium">Customer</span>
            <CustomerPicker customers={customers} defaultCustomerId={invoice.customer_id} required />
          </div>
          <Input label="Amount ($)" name="amount" type="number" step="0.01" defaultValue={invoice.amount ?? ""} required />
          <Input label="Amount Paid ($)" name="amount_paid" type="number" step="0.01" defaultValue={invoice.amount_paid ?? ""} />
          <Input label="Due Date" name="due_date" type="date" defaultValue={invoice.due_date || ""} />
          <Input
            label="Payment Method"
            name="payment_method"
            defaultValue={invoice.payment_method || ""}
            placeholder="Cash, Zelle, Card…"
          />
          <div className="md:col-span-3">
            <Input label="Notes" name="notes" defaultValue={invoice.notes || ""} />
          </div>
          <div className="md:col-span-3 flex items-center gap-4">
            <Button type="submit">Save Changes</Button>
            <Link href="/invoices" className="text-sm text-slate-500 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
