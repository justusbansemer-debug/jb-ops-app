import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Button } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

// You decide what each service is and how it's priced.
const PRICING = [
  { value: "flat", label: "Flat price — one set price" },
  { value: "per_unit", label: "Per unit — price × quantity (sq ft, windows…)" },
  { value: "hourly", label: "Hourly — price per hour" },
  { value: "range", label: "Range — from one price up to another" },
  { value: "custom", label: "No set price — you price it each time" },
];

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return `$${n.toFixed(2)}`;
}

function priceSummary(s) {
  if (s.pricing_type === "custom") return "Priced per job";
  if (s.pricing_type === "range") {
    return s.price != null && s.price_max != null
      ? `${money(s.price)} – ${money(s.price_max)}`
      : money(s.price) || "Priced per job";
  }
  if (s.pricing_type === "hourly")
    return s.price != null ? `${money(s.price)} / hour` : "Priced per job";
  if (s.pricing_type === "per_unit")
    return s.price != null
      ? `${money(s.price)} / ${s.unit_label || "unit"}`
      : "Priced per job";
  return money(s.price) || "Priced per job";
}

function rowFromForm(formData) {
  const num = (k) => {
    const raw = String(formData.get(k) || "").trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const text = (k) => String(formData.get(k) || "").trim() || null;
  const pricing_type = String(formData.get("pricing_type") || "flat");

  return {
    name: String(formData.get("name") || "").trim(),
    description: text("description"),
    pricing_type,
    price: num("price"),
    price_max: pricing_type === "range" ? num("price_max") : null,
    unit_label: pricing_type === "per_unit" ? text("unit_label") || "unit" : null,
    default_notes: text("default_notes"),
    active: formData.get("active") != null,
    sort_order: num("sort_order") ?? 0,
  };
}

async function addService(formData) {
  "use server";

  const row = rowFromForm(formData);
  if (!row.name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert(row);
  if (error) {
    console.error("Failed to add service:", error.message);
    return;
  }
  revalidatePath("/settings/services");
}

async function updateService(formData) {
  "use server";

  const id = String(formData.get("id") || "");
  const row = rowFromForm(formData);
  if (!id || !row.name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("services").update(row).eq("id", id);
  if (error) {
    console.error("Failed to update service:", error.message);
    return;
  }
  revalidatePath("/settings/services");
}

async function deleteService(id) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete service:", error.message);
    return;
  }
  revalidatePath("/settings/services");
}

// The same set of fields for both adding and editing.
function ServiceFields({ s }) {
  return (
    <>
      <Input
        label="Service name"
        name="name"
        required
        defaultValue={s?.name || ""}
        placeholder="House Washing"
      />
      <label className="block text-sm">
        <span className="text-slate-600 font-medium">How is it priced?</span>
        <select
          name="pricing_type"
          defaultValue={s?.pricing_type || "flat"}
          className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          {PRICING.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Price ($)"
        name="price"
        type="number"
        step="0.01"
        min="0"
        defaultValue={s?.price ?? ""}
        placeholder="350.00"
      />
      <Input
        label="Up to ($) — range only"
        name="price_max"
        type="number"
        step="0.01"
        min="0"
        defaultValue={s?.price_max ?? ""}
        placeholder="500.00"
      />
      <Input
        label="Unit — per unit only"
        name="unit_label"
        defaultValue={s?.unit_label || ""}
        placeholder="sq ft"
      />
      <Input
        label="Sort order"
        name="sort_order"
        type="number"
        defaultValue={s?.sort_order ?? 0}
      />
      <div className="md:col-span-3">
        <Input
          label="Short description"
          name="description"
          defaultValue={s?.description || ""}
          placeholder="Soft wash siding, gutters, and trim"
        />
      </div>
      <div className="md:col-span-3">
        <label className="block text-sm">
          <span className="text-slate-600 font-medium">Default notes</span>
          <span className="block text-xs text-slate-400">
            What the customer reads on the estimate when you pick this service
          </span>
          <textarea
            name="default_notes"
            rows={3}
            defaultValue={s?.default_notes || ""}
            placeholder="Includes pre-treatment, soft wash of all siding, and a rinse of windows and doors."
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm md:col-span-3">
        <input
          type="checkbox"
          name="active"
          defaultChecked={s ? !!s.active : true}
          className="w-4 h-4"
        />
        <span className="text-slate-600 font-medium">Active</span>
      </label>
    </>
  );
}

export default async function ServicesSettingsPage() {
  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <Link href="/settings" className="text-sm text-slate-500">
        ← Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold">My services</h1>
        <p className="text-slate-500 text-sm mt-1">
          Your own price list. Set each one up however you want — flat price,
          per square foot, hourly, a range, or priced on the spot.
        </p>
      </div>

      {error && (
        <p className="text-red-600 text-sm">
          Could not load services — run supabase/menu-services-settings.sql in
          Supabase first.
        </p>
      )}

      <Card title="Add a service" id="add">
        <form
          action={addService}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <ServiceFields />
          <div className="md:col-span-3">
            <Button type="submit">Add Service</Button>
          </div>
        </form>
      </Card>

      <Card title={`Your Services (${services?.length ?? 0})`}>
        {!error && (!services || services.length === 0) && (
          <p className="text-slate-400 text-sm">
            Nothing here yet — add the work you do most and the price comes
            with it every time.
          </p>
        )}

        {services && services.length > 0 && (
          <div className="divide-y divide-slate-100">
            {services.map((s) => (
              <div key={s.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{s.name}</span>
                      {!s.active && (
                        <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-green-700 mt-0.5">
                      {priceSummary(s)}
                    </p>
                    {s.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <DeleteButton action={deleteService} id={s.id} label="service" />
                </div>

                <details className="mt-2">
                  <summary className="text-xs font-medium text-slate-400 hover:text-orange-600 cursor-pointer">
                    Edit
                  </summary>
                  <form
                    action={updateService}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <ServiceFields s={s} />
                    <div className="md:col-span-3">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </details>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
