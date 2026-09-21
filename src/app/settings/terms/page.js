import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Input, Button } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

function rowFromForm(formData) {
  const num = (k) => {
    const raw = String(formData.get(k) || "").trim();
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    name: String(formData.get("name") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    is_default: formData.get("is_default") != null,
    active: formData.get("active") != null,
    sort_order: num("sort_order"),
  };
}

// Only one template can carry the default flag, so clear the others first.
async function clearOtherDefaults(supabase, keepId) {
  let q = supabase.from("terms_templates").update({ is_default: false }).eq("is_default", true);
  if (keepId) q = q.neq("id", keepId);
  await q;
}

async function addTerms(formData) {
  "use server";

  const row = rowFromForm(formData);
  if (!row.name || !row.body) return;

  const supabase = await createClient();
  if (row.is_default) await clearOtherDefaults(supabase);

  const { error } = await supabase.from("terms_templates").insert(row);
  if (error) {
    console.error("Failed to add terms:", error.message);
    return;
  }
  revalidatePath("/settings/terms");
  revalidatePath("/quotes");
}

async function updateTerms(formData) {
  "use server";

  const id = String(formData.get("id") || "");
  const row = rowFromForm(formData);
  if (!id || !row.name || !row.body) return;

  const supabase = await createClient();
  if (row.is_default) await clearOtherDefaults(supabase, id);

  const { error } = await supabase.from("terms_templates").update(row).eq("id", id);
  if (error) {
    console.error("Failed to update terms:", error.message);
    return;
  }
  revalidatePath("/settings/terms");
  revalidatePath("/quotes");
}

async function deleteTerms(id) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.from("terms_templates").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete terms:", error.message);
    return;
  }
  revalidatePath("/settings/terms");
  revalidatePath("/quotes");
}

function TermsFields({ t }) {
  return (
    <>
      <div className="md:col-span-2">
        <Input
          label="Name"
          name="name"
          required
          defaultValue={t?.name || ""}
          placeholder="Standard terms"
        />
      </div>
      <Input
        label="Sort order"
        name="sort_order"
        type="number"
        defaultValue={t?.sort_order ?? 0}
      />
      <div className="md:col-span-3">
        <label className="block text-sm">
          <span className="text-slate-600 font-medium">
            The agreement your customer reads and signs
          </span>
          <span className="block text-xs text-slate-400">
            Write it however you want — payment, scheduling, access, whatever
            you need. Blank lines and line breaks are kept exactly as you type
            them.
          </span>
          <textarea
            name="body"
            rows={12}
            required
            defaultValue={t?.body || ""}
            placeholder={
              "PAYMENT\nPayment is due on completion unless agreed otherwise.\n\nSCHEDULING\nWork may be rescheduled for weather or unsafe conditions.\n\nACCESS\nPlease leave gates unlocked and vehicles clear of the work area."
            }
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm md:col-span-3">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={t ? !!t.is_default : false}
          className="w-4 h-4"
        />
        <span className="text-slate-600 font-medium">
          Use this one by default on new estimates
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-3">
        <input
          type="checkbox"
          name="active"
          defaultChecked={t ? !!t.active : true}
          className="w-4 h-4"
        />
        <span className="text-slate-600 font-medium">Active</span>
      </label>
    </>
  );
}

export default async function TermsSettingsPage() {
  const supabase = await createClient();
  const { data: templates, error } = await supabase
    .from("terms_templates")
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
        <h1 className="text-2xl font-bold">Terms &amp; conditions</h1>
        <p className="text-slate-500 text-sm mt-1">
          Write as many versions as you want, then pick one when you build an
          estimate. When the customer taps Accept, they have to read it to the
          bottom, tick the box, and sign before it goes through.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        The exact wording is copied onto the estimate the moment you save it, so
        editing a template later never changes an agreement someone already
        signed. Worth having a lawyer look over whatever you write here — I
        can&apos;t give legal advice.
      </div>

      {error && (
        <p className="text-red-600 text-sm">
          Could not load your terms — run supabase/terms-and-signature.sql in
          Supabase first.
        </p>
      )}

      <Card title="Add terms" id="add">
        <form action={addTerms} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TermsFields />
          <div className="md:col-span-3">
            <Button type="submit">Add Terms</Button>
          </div>
        </form>
      </Card>

      <Card title={`Your Terms (${templates?.length ?? 0})`}>
        {!error && (!templates || templates.length === 0) && (
          <p className="text-slate-400 text-sm">
            Nothing here yet — write your first set above and it&apos;ll show up
            as a choice on every estimate.
          </p>
        )}

        {templates && templates.length > 0 && (
          <div className="divide-y divide-slate-100">
            {templates.map((t) => (
              <div key={t.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{t.name}</span>
                      {t.is_default && (
                        <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      {!t.active && (
                        <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {t.body.slice(0, 160)}
                      {t.body.length > 160 ? "…" : ""}
                    </p>
                  </div>
                  <DeleteButton action={deleteTerms} id={t.id} label="terms" />
                </div>

                <details className="mt-2">
                  <summary className="text-xs font-medium text-slate-400 hover:text-orange-600 cursor-pointer">
                    Edit
                  </summary>
                  <form
                    action={updateTerms}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <TermsFields t={t} />
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
