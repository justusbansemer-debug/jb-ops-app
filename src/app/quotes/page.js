import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Select, Button } from "@/components/ui";
import CustomerPicker from "@/components/CustomerPicker";
import EstimatesView from "@/components/EstimatesView";

const SERVICE_TYPES = [
  "Soft Washing", "House Washing", "Roof Washing", "Driveway Cleaning",
  "Gutter Cleaning", "Gutter Whitening", "Window Cleaning", "Small Commercial",
  "Christmas Lights Install", "Christmas Lights Removal", "Other",
];
const QUOTE_TYPES = ["Standard", "Options"];

async function addQuote(formData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase.from("quotes").insert({
    customer_id: String(formData.get("customer_id") || "") || null,
    service_type: String(formData.get("service_type") || ""),
    quote_type: String(formData.get("quote_type") || "Standard"),
    amount: Number(formData.get("amount") || 0) || null,
    status: "Pending",
    follow_up_date: String(formData.get("follow_up_date") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    console.error("Failed to add quote:", error.message);
    return;
  }

  revalidatePath("/quotes");
}

// The four colored buttons on each estimate card.
async function cardAction(formData) {
  "use server";

  const id = String(formData.get("quote_id") || "");
  const op = String(formData.get("op") || "");
  if (!id || !op) return;

  const supabase = await createClient();

  const { data: quote, error: readError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (readError || !quote) {
    console.error("Estimate action: could not load quote", readError?.message);
    return;
  }

  if (op === "schedule") {
    // Turn the estimate into a scheduled job and remember which job it became.
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        customer_id: quote.customer_id,
        service_type: quote.service_type,
        scheduled_at: quote.follow_up_date
          ? new Date(`${quote.follow_up_date}T09:00:00`).toISOString()
          : new Date().toISOString(),
        status: "Scheduled",
        price: quote.amount,
        notes: quote.notes,
      })
      .select("id")
      .single();

    if (error || !job) {
      console.error("Failed to schedule estimate:", error?.message);
      return;
    }

    await supabase
      .from("quotes")
      .update({ scheduled_job_id: job.id, status: "Accepted" })
      .eq("id", id);

    await supabase
      .from("quote_events")
      .insert({ quote_id: id, event_type: "scheduled" });

    revalidatePath("/quotes");
    revalidatePath("/jobs");
    return;
  }

  if (op === "invoice") {
    const due = new Date();
    due.setDate(due.getDate() + 14);

    const { error } = await supabase.from("invoices").insert({
      customer_id: quote.customer_id,
      job_id: quote.scheduled_job_id || null,
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      amount: quote.amount || 0,
      amount_paid: 0,
      notes: `From estimate #${quote.quote_number ?? ""} — ${quote.service_type || ""}`.trim(),
    });

    if (error) {
      console.error("Failed to invoice estimate:", error.message);
      return;
    }

    await supabase
      .from("quote_events")
      .insert({ quote_id: id, event_type: "invoiced" });

    revalidatePath("/quotes");
    revalidatePath("/invoices");
    return;
  }

  if (op === "decline") {
    await supabase
      .from("quotes")
      .update({ status: "Declined", declined_at: new Date().toISOString() })
      .eq("id", id);

    await supabase
      .from("quote_events")
      .insert({ quote_id: id, event_type: "declined" });

    revalidatePath("/quotes");
    return;
  }

  if (op === "paid") {
    await supabase
      .from("quotes")
      .update({ paid_at: new Date().toISOString(), status: "Accepted" })
      .eq("id", id);

    await supabase
      .from("quote_events")
      .insert({ quote_id: id, event_type: "paid" });

    revalidatePath("/quotes");
    return;
  }
}

// "Add Comment" — writes into the same activity log the estimate link uses.
async function addComment(formData) {
  "use server";

  const id = String(formData.get("quote_id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!id || !note) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_events")
    .insert({ quote_id: id, event_type: "comment", note: note.slice(0, 2000) });

  if (error) {
    console.error("Failed to add comment:", error.message);
    return;
  }

  revalidatePath("/quotes");
}

// Archive / un-archive, one card or a whole selection.
async function bulkAction(formData) {
  "use server";

  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const op = String(formData.get("op") || "");
  if (!ids.length) return;

  const supabase = await createClient();

  if (op === "archive" || op === "unarchive") {
    await supabase
      .from("quotes")
      .update({ archived_at: op === "archive" ? new Date().toISOString() : null })
      .in("id", ids);
  }

  revalidatePath("/quotes");
}

export default async function QuotesPage() {
  const supabase = await createClient();

  const [{ data: quotes, error }, { data: customers }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "*, customers(first_name, last_name, company, phone, street_address, city, state, zip)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id, first_name, last_name, company")
      .order("first_name"),
  ]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-red-600 text-sm">
          Could not load estimates — {error.message}
        </p>
      )}

      <EstimatesView
        quotes={quotes || []}
        services={SERVICE_TYPES}
        cardAction={cardAction}
        commentAction={addComment}
        bulkAction={bulkAction}
      />

      <Card title="Create an Estimate" id="add">
        <form action={addQuote} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="block text-sm">
            <span className="text-slate-600 font-medium">Customer</span>
            <CustomerPicker customers={customers} required />
          </div>
          <Select label="Service Type" name="service_type" options={SERVICE_TYPES} />
          <Input label="Amount ($)" name="amount" type="number" step="0.01" required />
          <Select label="Estimate Type" name="quote_type" options={QUOTE_TYPES} />
          <Input label="Follow-up Date" name="follow_up_date" type="date" />
          <div className="md:col-span-1">
            <Input label="Notes" name="notes" />
          </div>
          <div className="md:col-span-3">
            <Button type="submit">Add Estimate</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
