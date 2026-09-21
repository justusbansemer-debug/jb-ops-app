import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EstimateWizard from "@/components/estimate/EstimateWizard";
import { createEstimate } from "./actions";

export const dynamic = "force-dynamic";

// The estimate builder: customer, services, totals, preview, send.

export default async function NewEstimatePage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: services }, { data: terms }, { data: business }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, first_name, last_name, company, phone, email, street_address, city, state, zip")
        .order("last_name", { ascending: true }),
      supabase
        .from("services")
        .select("id, name, pricing_type, price, unit_label, default_notes, active, sort_order")
        .order("sort_order", { ascending: true }),
      supabase.from("terms_templates").select("id, name").order("name", { ascending: true }),
      supabase.from("business_settings").select("*").limit(1).maybeSingle(),
    ]);

  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-2xl font-bold tracking-tight">New estimate</h1>
        <Link href="/quotes" className="text-sm font-semibold text-slate-500">
          Cancel
        </Link>
      </div>

      {activeServices.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 mb-3">
          You haven&apos;t saved any services yet. Add your price list under{" "}
          <Link href="/settings/services" className="font-semibold underline">
            Settings → My services
          </Link>{" "}
          and they&apos;ll show up here with their prices. You can still add one-off services.
        </div>
      )}

      <EstimateWizard
        customers={customers || []}
        services={activeServices}
        terms={terms || []}
        business={business || null}
        createEstimate={createEstimate}
      />
    </div>
  );
}
