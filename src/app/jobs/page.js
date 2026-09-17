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
const JOB_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];

async function addJob(formData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase.from("jobs").insert({
    customer_id: String(formData.get("customer_id") || "") || null,
    service_type: String(formData.get("service_type") || ""),
    scheduled_at: String(formData.get("scheduled_at") || "") || null,
    status: String(formData.get("status") || "Scheduled"),
    assigned_employee: String(formData.get("assigned_employee") || "").trim() || null,
    price: Number(formData.get("price") || 0) || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    console.error("Failed to add job:", error.message);
    return;
  }

  revalidatePath("/jobs");
}

async function deleteJob(id) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete job:", error.message);
    return;
  }

  revalidatePath("/jobs");
}

export default async function JobsPage() {
  const supabase = await createClient();

  const [{ data: jobs, error }, { data: customers }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, customers(first_name, last_name, company)")
      .order("scheduled_at", { ascending: true }),
    supabase.from("customers").select("id, first_name, last_name, company").order("first_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p className="text-slate-500 text-sm mt-1">
          One row per scheduled or completed job.
        </p>
      </div>

      <Card title="Schedule a Job">
        <form action={addJob} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Input label="Scheduled Date & Time" name="scheduled_at" type="datetime-local" />
          <Select label="Status" name="status" options={JOB_STATUSES} />
          <Input label="Assigned Employee" name="assigned_employee" />
          <Input label="Price ($)" name="price" type="number" step="0.01" />
          <div className="md:col-span-3">
            <Input label="Notes" name="notes" />
          </div>
          <div className="md:col-span-3">
            <Button type="submit">Add Job</Button>
          </div>
        </form>
        {(!customers || customers.length === 0) && (
          <p className="text-xs text-slate-400 mt-3">
            Add a customer on the Customers page first, then they&apos;ll show up here.
          </p>
        )}
      </Card>

      <Card title={`All Jobs (${jobs?.length ?? 0})`}>
        {error && (
          <p className="text-red-600 text-sm">
            Could not load jobs yet — connect Supabase in .env.local to see real data here.
          </p>
        )}
        {!error && (!jobs || jobs.length === 0) && (
          <p className="text-slate-400 text-sm">No jobs yet — schedule your first one above.</p>
        )}
        {!error && jobs && jobs.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Service</th>
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Price</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b border-slate-50">
                      <td className="py-3 pr-4 text-slate-600">
                        {j.scheduled_at ? new Date(j.scheduled_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {j.customers ? `${j.customers.first_name} ${j.customers.last_name}` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{j.service_type}</td>
                      <td className="py-3 pr-4 text-slate-600">{j.assigned_employee || "—"}</td>
                      <td className="py-3 pr-4">
                        <StatusPill status={j.status} />
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {j.price != null ? `$${Number(j.price).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/jobs/${j.id}/edit`}
                            className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                          >
                            Edit
                          </Link>
                          <DeleteButton action={deleteJob} id={j.id} label="job" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {jobs.map((j) => (
                <MobileCard
                  key={j.id}
                  title={j.customers ? `${j.customers.first_name} ${j.customers.last_name}` : "—"}
                  subtitle={j.service_type}
                  topRight={<StatusPill status={j.status} />}
                >
                  <CardField
                    label="When"
                    value={j.scheduled_at ? new Date(j.scheduled_at).toLocaleString() : null}
                  />
                  <CardField label="Employee" value={j.assigned_employee} />
                  <CardField
                    label="Price"
                    value={j.price != null ? `$${Number(j.price).toFixed(2)}` : null}
                  />
                  <div className="pt-1 flex items-center gap-4">
                    <Link
                      href={`/jobs/${j.id}/edit`}
                      className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                    >
                      Edit
                    </Link>
                    <DeleteButton action={deleteJob} id={j.id} label="job" />
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
