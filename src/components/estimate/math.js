// Shared money helpers for the estimate wizard.

export function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0.00";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Services priced by quantity need a number before there's a total.
export function byQuantity(type) {
  return type === "per_unit" || type === "hourly";
}

export function unitWord(item) {
  if (item.pricing_type === "hourly") return "hours";
  return item.unit_label || "units";
}

// One line's total: a typed flat rate always wins, otherwise price x quantity.
export function lineTotal(item) {
  if (item.flat !== "" && item.flat !== null && item.flat !== undefined) {
    return num(item.flat);
  }
  if (byQuantity(item.pricing_type)) {
    return num(item.unit_price) * num(item.quantity);
  }
  return num(item.unit_price);
}

// Everything the Edit and Preview steps need, from the lines plus the
// discount / tax / deposit boxes.
export function totals(items, { discount = 0, taxRate = 0, deposit = 0 } = {}) {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const afterDiscount = Math.max(subtotal - num(discount), 0);
  const tax = afterDiscount * (num(taxRate) / 100);
  const total = afterDiscount + tax;
  const balance = Math.max(total - num(deposit), 0);
  return { subtotal, afterDiscount, tax, total, balance };
}
