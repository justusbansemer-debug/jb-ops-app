import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Select, Button, MobileCard, CardField } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

// This runs on the server whenever the "Add Customer" form is submitted.
async function addCustomer(formData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase.from("customers").insert({
    first_name: String(formData.get("first_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    company: String(formData.get("company") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    street_address: String(formData.get("street_address") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "NC").trim(),
    zip: String(formData.get("zip") || "").trim() || null,
    referral_source: String(formData.get("referral_source") || "").trim() || null,
  });

  if (error) {
    console.error("Failed to add customer:", error.message);
    return;
  }

  // Tells Next.js "the customers page's data changed, show the new list."
  revalidatePath("/customers");
}

async function deleteCustomer(id) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete customer:", error.message);
    return;
  }

  revalidatePath("/customers");
}

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-slate-500 text-sm mt-1">
          Your master contact list — every job, quote, and invoice links back to a customer here.
        </p>
      </div>

      <Card title="Add a Customer" id="add">
        <form action={addCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="First Name" name="first_name" required />
          <Input label="Last Name" name="last_name" required />
          <Input label="Company (if commercial)" name="company" />
          <Input label="Phone" name="phone" type="tel" />
          <Input label="Email" name="email" type="email" />
          <Select
            label="Referral Source"
            name="referral_source"
            options={["Google", "Yelp", "Facebook", "Referral", "Door Flyer", "Repeat Customer", "Other"]}
          />
          <Input label="Street Address" name="street_address" />
          <Input label="City" name="city" />
          <Input label="ZIP" name="zip" />
          <div className="md:col-span-3">
            <Button type="submit">Add Customer</Button>
          </div>
        </form>
      </Card>

      <Card title={`All Customers (${customers?.length ?? 0})`}>
        {error && (
          <p className="text-red-600 text-sm">
            Could not load customers yet — connect Supabase in .env.local to see real data here.
          </p>
        )}
        {!error && (!customers || customers.length === 0) && (
          <p className="text-slate-400 text-sm">No customers yet — add your first one above.</p>
        )}
        {!error && customers && customers.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2 pr-4">Referral</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-3 pr-4 font-semibold">
                        <Link href={`/customers/${c.id}`} className="hover:text-orange-600">
                          {c.first_name} {c.last_name}
                        </Link>
                        {c.company && <div className="text-xs text-slate-400 font-normal">{c.company}</div>}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{c.phone || "—"}</td>
                      <td className="py-3 pr-4 text-slate-600">{c.email || "—"}</td>
                      <td className="py-3 pr-4 text-slate-600">{c.city || "—"}</td>
                      <td className="py-3 pr-4 text-slate-600">{c.referral_source || "—"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/customers/${c.id}/edit`}
                            className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                          >
                            Edit
                          </Link>
                          <DeleteButton action={deleteCustomer} id={c.id} label="customer" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {customers.map((c) => (
                <MobileCard
                  key={c.id}
                  title={<Link href={`/customers/${c.id}`} className="hover:text-orange-600">{c.first_name} {c.last_name}</Link>}
                  subtitle={c.company || null}
                  topRight={
                    <Link
                      href={`/customers/${c.id}/edit`}
                      className="text-slate-400 hover:text-orange-600 text-xs font-medium"
                    >
                      Edit
                    </Link>
                  }
                >
                  <CardField label="Phone" value={c.phone} />
                  <CardField label="Email" value={c.email} />
                  <CardField label="City" value={c.city} />
                  <CardField label="Referral" value={c.referral_source} />
                  <div className="pt-1">
                    <DeleteButton action={deleteCustomer} id={c.id} label="customer" />
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
