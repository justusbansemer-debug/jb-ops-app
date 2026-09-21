"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Saves an estimate built in the wizard: the estimate itself, then one row
// per service. Written so it still works if the quote_items migration
// hasn't been run yet — you just lose the per-service breakdown.

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function summarize(items) {
  if (items.length === 0) return "Estimate";
  if (items.length === 1) return items[0].name;
  return `${items[0].name} +${items.length - 1} more`;
}

export async function createEstimate(payload) {
  const supabase = await createClient();
  const items = payload.items || [];

  if (!payload.customerId) return { error: "Pick a customer first." };
  if (items.length === 0) return { error: "Put a price on at least one service." };

  const subtotal = items.reduce((s, i) => s + n(i.amount), 0);
  const afterDiscount = Math.max(subtotal - n(payload.discount), 0);
  const total = afterDiscount + afterDiscount * (n(payload.taxRate) / 100);

  // Copy the terms wording onto the estimate now, so editing the template
  // later never changes an agreement someone already signed.
  let termsText = null;
  if (payload.termsId) {
    const { data: t } = await supabase
      .from("terms_templates")
      .select("body")
      .eq("id", payload.termsId)
      .maybeSingle();
    termsText = t?.body || null;
  }

  const base = {
    customer_id: payload.customerId,
    service_type: summarize(items),
    quote_type: "Standard",
    amount: Number(total.toFixed(2)),
    status: "Pending",
    follow_up_date: payload.followUp || null,
    notes: payload.message?.trim() || null,
    terms_id: payload.termsId || null,
    terms_text: termsText,
  };

  const extras = {
    discount: n(payload.discount),
    tax_rate: n(payload.taxRate),
    deposit: n(payload.deposit),
    subtotal: Number(subtotal.toFixed(2)),
    client_message: payload.message?.trim() || null,
  };

  // Try with the new money columns; fall back if the migration isn't in yet.
  let quote = null;
  let { data, error } = await supabase
    .from("quotes")
    .insert({ ...base, ...extras })
    .select("id, share_token")
    .single();

  if (error) {
    const retry = await supabase.from("quotes").insert(base).select("id, share_token").single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return { error: error?.message || "Could not save the estimate." };
  }
  quote = data;

  const { error: itemsError } = await supabase.from("quote_items").insert(
    items.map((i, idx) => ({
      quote_id: quote.id,
      service_id: i.service_id || null,
      name: i.name,
      pricing_type: i.pricing_type || "flat",
      unit_label: i.unit_label || null,
      unit_price: i.unit_price,
      quantity: i.quantity,
      amount: Number(n(i.amount).toFixed(2)),
      notes: i.notes,
      sort_order: i.sort_order ?? idx,
    }))
  );

  const h = await headers();
  const host = h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const shareUrl = quote.share_token ? `${proto}://${host}/e/${quote.share_token}` : null;

  revalidatePath("/quotes");
  revalidatePath("/");

  return {
    id: quote.id,
    shareUrl,
    warning: itemsError ? "Saved, but the per-service breakdown needs the quote_items migration." : null,
  };
}
