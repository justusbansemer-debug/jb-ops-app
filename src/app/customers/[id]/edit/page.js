import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Select, Button } from "@/components/ui";

async function updateCustomer(formData) {
  "use server";

  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
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
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update customer:", error.message);
    return;
  }

  revalidatePath("/customers");
  redirect("/customers");
}

export default async function EditCustomerPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Customer</h1>
        <p className="text-slate-500 text-sm mt-1">
          {customer.first_name} {customer.last_name}
        </p>
      </div>

      <Card>
        <form action={updateCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="hidden" name="id" value={customer.id} />
          <Input label="First Name" name="first_name" defaultValue={customer.first_name} required />
          <Input label="Last Name" name="last_name" defaultValue={customer.last_name} required />
          <Input label="Company (if commercial)" name="company" defaultValue={customer.company || ""} />
          <Input label="Phone" name="phone" type="tel" defaultValue={customer.phone || ""} />
          <Input label="Email" name="email" type="email" defaultValue={customer.email || ""} />
          <Select
            label="Referral Source"
            name="referral_source"
            defaultValue={customer.referral_source || "Google"}
            options={["Google", "Yelp", "Facebook", "Referral", "Door Flyer", "Repeat Customer", "Other"]}
          />
          <Input label="Street Address" name="street_address" defaultValue={customer.street_address || ""} />
          <Input label="City" name="city" defaultValue={customer.city || ""} />
          <Input label="ZIP" name="zip" defaultValue={customer.zip || ""} />
          <div className="md:col-span-3 flex items-center gap-4">
            <Button type="submit">Save Changes</Button>
            <Link href="/customers" className="text-sm text-slate-500 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
