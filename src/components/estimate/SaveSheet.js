"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "./math";

// The sheet that slides up once the estimate is saved: send it, schedule it,
// or go look at it.

function Item({ href, onClick, title, sub }) {
  const body = (
    <>
      <div className="font-semibold text-slate-800">{title}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </>
  );
  const cls =
    "block w-full text-left px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50";
  if (href) {
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export default function SaveSheet({ quoteId, shareUrl, customer, total, onNew }) {
  const [copied, setCopied] = useState(false);
  const name = customer ? `${customer.first_name} ${customer.last_name}` : "your customer";
  const text = shareUrl ? `Hi ${customer?.first_name || ""} — here's your estimate: ${shareUrl}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/40">
      <div className="bg-white w-full max-w-lg rounded-t-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 py-3 bg-navy-800 text-white flex items-center justify-between">
          <span className="font-semibold">Estimate saved</span>
          <span className="text-sm">{money(total)}</span>
        </div>

        <div className="px-4 py-2 text-sm text-slate-500 border-b border-slate-100">For {name}</div>

        {shareUrl && (
          <>
            <Item
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl);
                setCopied(true);
              }}
              title={copied ? "Link copied" : "Copy link"}
              sub="Send it however you like"
            />
            {customer?.phone && (
              <Item
                href={`sms:${customer.phone}&body=${encodeURIComponent(text)}`}
                title="Text it"
                sub={`Opens Messages to ${customer.phone}`}
              />
            )}
            {customer?.email && (
              <Item
                href={`mailto:${customer.email}?subject=${encodeURIComponent(
                  "Your estimate"
                )}&body=${encodeURIComponent(text)}`}
                title="Email it"
                sub={`Opens Mail to ${customer.email}`}
              />
            )}
          </>
        )}

        <Item href={`/quotes/${quoteId}`} title="Open the estimate" sub="Send, track and edit it" />
        <Item href="/quotes" title="All estimates" sub="Back to the list" />
        <Item onClick={onNew} title="Start another estimate" sub="Fresh one for the next customer" />

        <div className="p-3">
          <Link
            href="/"
            className="block text-center w-full py-3 rounded-xl border border-slate-200 font-semibold text-slate-600"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}
