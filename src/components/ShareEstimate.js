"use client";

// "Send Estimate" — hands the link off to your phone's Messages or Mail app
// with the note already written, or just copies it so you can paste it
// anywhere. Tapping Text or Email also stamps the estimate as sent.
import { useState } from "react";

function digits(v) {
  return (v || "").replace(/[^\d+]/g, "");
}

export default function ShareEstimate({
  url,
  firstName,
  phone,
  email,
  serviceType,
  amount,
  businessName,
  markSent,
}) {
  const [copied, setCopied] = useState(false);
  const [sentNow, setSentNow] = useState(false);

  const who = firstName ? `Hi ${firstName}, ` : "Hi, ";
  const price =
    amount != null && amount !== ""
      ? ` — $${Number(amount).toFixed(2)}`
      : "";
  const body =
    `${who}here's your estimate from ${businessName || "J.B. Pressure Washing"}` +
    `${serviceType ? ` for ${serviceType}` : ""}${price}.\n\n` +
    `You can accept it, decline, or ask for a change right from this link:\n${url}`;

  const subject = `Your estimate from ${businessName || "J.B. Pressure Washing"}`;

  // ?&body= is the form that works on both iPhone and Android.
  const smsHref = `sms:${digits(phone)}?&body=${encodeURIComponent(body)}`;
  const mailHref = `mailto:${email || ""}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  async function stamp() {
    setSentNow(true);
    try {
      await markSent();
    } catch {
      // Sending still worked — the "Sent" stamp just didn't save.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {phone ? (
          <a
            href={smsHref}
            onClick={stamp}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-4 py-3 rounded-lg text-center"
          >
            Text it
          </a>
        ) : (
          <span className="bg-slate-100 text-slate-400 font-semibold text-sm px-4 py-3 rounded-lg text-center">
            No phone on file
          </span>
        )}

        {email ? (
          <a
            href={mailHref}
            onClick={stamp}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-3 rounded-lg text-center"
          >
            Email it
          </a>
        ) : (
          <span className="bg-slate-100 text-slate-400 font-semibold text-sm px-4 py-3 rounded-lg text-center">
            No email on file
          </span>
        )}

        <button
          type="button"
          onClick={copy}
          className="bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-sm px-4 py-3 rounded-lg"
        >
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3 break-all">{url}</p>

      {sentNow && (
        <p className="text-xs text-green-700 font-medium mt-2">
          Marked as sent — refresh to see the tracking update.
        </p>
      )}
    </div>
  );
}
