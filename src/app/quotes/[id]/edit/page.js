import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Select, Button } from "@/components/ui";

const SERVICE_TYPES = [
  "Soft Washing", "House Washing", "Roof Washing", "Driveway Cleaning",
  "Gutter Cleaning", "Gutter Whitening", "Window Cleaning", "Small Commercial",
  "Christmas Lights Install", "Christmas Lights Removal", "Other",
];
const QUOTE_STATUSES = ["Pending", "Accepted", "Declined", "Expired"];

async function updateQuote(formData) {
  "use server";

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .update({
      customer_id: String(formData.get("customer_id") || "") || null,
      service_type: String(formData.get("service_type") || ""),
      amount: Number(formData.get("amount") || 0) || null,
      status: String(formData.get("status") || "Pending"),
      follow_up_date: String(formData.get("follow_up_date") || "") || null,
      notes: String(formData.get("notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update quote:", error.message);
    return;
  }

  revalidatePath("/quotes");
  redirect("/quotes");
}

export default async function EditQuotePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: customers }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single(),
    supabase.from("customers").select("id, first_name, last_name, company").order("first_name"),
  ]);

  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Quote</h1>
      </div>

      <Card>
        <form action={updateQuote} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="hidden" name="id" value={quote.id} />
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Customer</span>
            <select
              name="customer_id"
              required
              defaultValue={quote.customer_id || ""}
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
          <Select label="Service Type" name="service_type" defaultValue={quote.service_type} options={SERVICE_TYPES} />
          <Input label="Amount ($)" name="amount" type="number" step="0.01" defaultValue={quote.amount ?? ""} required />
          <Select label="Status" name="status" defaultValue={quote.status} options={QUOTE_STATUSES} />
          <Input label="Follow-up Date" name="follow_up_date" type="date" defaultValue={quote.follow_up_date || ""} />
          <div className="md:col-span-3">
            <Input label="Notes" name="notes" defaultValue={quote.notes || ""} />
          </div>
          <div className="md:col-span-3 flex items-center gap-4">
            <Button type="submit">Save Changes</Button>
            <Link href="/quotes" className="text-sm text-slate-500 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
