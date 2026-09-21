import { createClient } from "@/lib/supabase/server";
import MeasureTool from "@/components/MeasureTool";

export const dynamic = "force-dynamic";

export default async function MeasurePage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, company, street_address, city, state, zip")
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Measure a property</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pull up any property on satellite and measure it before you quote.
        </p>
      </div>

      <MeasureTool customers={customers || []} />
    </div>
  );
}
