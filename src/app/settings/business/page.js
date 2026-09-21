import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

async function saveBusiness(formData) {
  "use server";

  const supabase = await createClient();
  const text = (k) => String(formData.get(k) || "").trim() || null;

  const { error } = await supabase.from("business_settings").upsert({
    id: 1,
    business_name: text("business_name"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    address: text("address"),
    estimate_footer: text("estimate_footer"),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to save business settings:", error.message);
    return;
  }

  revalidatePath("/settings/business");
}

export default async function BusinessSettingsPage() {
  const supabase = await createClient();
  const { data: biz, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const v = biz || {};

  return (
    <div className="space-y-6">
      <Link href="/settings" className="text-sm text-slate-500">
        ← Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Business info</h1>
        <p className="text-slate-500 text-sm mt-1">
          This is what a customer sees at the bottom of any estimate you send
          them.
        </p>
      </div>

      {error && (
        <p className="text-red-600 text-sm">
          Could not load these settings — run supabase/menu-services-settings.sql
          in Supabase first.
        </p>
      )}

      <Card title="Details">
        <form action={saveBusiness} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Business name"
            name="business_name"
            defaultValue={v.business_name || ""}
            placeholder="J.B. Pressure Washing"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={v.phone || ""}
            placeholder="(704) 555-0123"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={v.email || ""}
            placeholder="you@example.com"
          />
          <Input
            label="Website"
            name="website"
            defaultValue={v.website || ""}
            placeholder="jbpressurewashing.com"
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              name="address"
              defaultValue={v.address || ""}
              placeholder="Stanfield, NC 28163"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">
              <span className="text-slate-600 font-medium">
                Estimate footer
              </span>
              <span className="block text-xs text-slate-400">
                Optional — terms, deposit policy, how long the price holds
              </span>
              <textarea
                name="estimate_footer"
                rows={3}
                defaultValue={v.estimate_footer || ""}
                placeholder="Prices hold for 30 days. Payment due on completion. Fully insured."
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
