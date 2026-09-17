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
const JOB_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];

async function updateJob(formData) {
  "use server";

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({
      customer_id: String(formData.get("customer_id") || "") || null,
      service_type: String(formData.get("service_type") || ""),
      scheduled_at: String(formData.get("scheduled_at") || "") || null,
      status: String(formData.get("status") || "Scheduled"),
      assigned_employee: String(formData.get("assigned_employee") || "").trim() || null,
      price: Number(formData.get("price") || 0) || null,
      notes: String(formData.get("notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update job:", error.message);
    return;
  }

  revalidatePath("/jobs");
  redirect("/jobs");
}

// Supabase gives us an ISO timestamp; <input type="datetime-local"> wants
// "YYYY-MM-DDTHH:MM" in the browser's local time.
function toLocalInputValue(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditJobPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: customers }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).single(),
    supabase.from("customers").select("id, first_name, last_name, company").order("first_name"),
  ]);

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Job</h1>
      </div>

      <Card>
        <form action={updateJob} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="hidden" name="id" value={job.id} />
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Customer</span>
            <select
              name="customer_id"
              required
              defaultValue={job.customer_id || ""}
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
          <Select label="Service Type" name="service_type" defaultValue={job.service_type} options={SERVICE_TYPES} />
          <Input
            label="Scheduled Date & Time"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(job.scheduled_at)}
          />
          <Select label="Status" name="status" defaultValue={job.status} options={JOB_STATUSES} />
          <Input label="Assigned Employee" name="assigned_employee" defaultValue={job.assigned_employee || ""} />
          <Input label="Price ($)" name="price" type="number" step="0.01" defaultValue={job.price ?? ""} />
          <div className="md:col-span-3">
            <Input label="Notes" name="notes" defaultValue={job.notes || ""} />
          </div>
          <div className="md:col-span-3 flex items-center gap-4">
            <Button type="submit">Save Changes</Button>
            <Link href="/jobs" className="text-sm text-slate-500 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
