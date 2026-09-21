"use client";

// The buttons at the bottom of a customer's estimate page, the "they opened
// it" ping, and — when terms are attached — the read-and-sign step that
// Accept leads into. Everything talks to the database through the locked-down
// functions in supabase/estimate-links.sql and terms-and-signature.sql.
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SignaturePad from "@/components/SignaturePad";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const HEADLINE = {
  accepted: "You accepted this estimate",
  declined: "You declined this estimate",
  change_requested: "You asked for a change",
};

const BLURB = {
  accepted: "Thanks! We'll be in touch shortly to get you on the schedule.",
  declined: "Thanks for letting us know. Reach out any time if that changes.",
  change_requested:
    "Thanks — we got your note and will follow up with an updated estimate.",
};

const BADGE = {
  accepted: "bg-green-50 text-green-700",
  declined: "bg-slate-100 text-slate-500",
  change_requested: "bg-amber-50 text-amber-700",
};

export default function EstimateActions({ token, initialResponse, termsText }) {
  const [response, setResponse] = useState(initialResponse || null);
  const [mode, setMode] = useState(initialResponse ? "done" : "choose");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Read-and-sign state
  const [readToBottom, setReadToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [signature, setSignature] = useState(null);
  const termsBox = useRef(null);

  const pinged = useRef(false);
  const hasTerms = Boolean(termsText && termsText.trim());

  // Record the open from the customer's browser rather than on the server.
  // Text and email apps quietly fetch links to build a preview card; doing
  // this here means those previews don't show up as "they opened it".
  useEffect(() => {
    if (pinged.current) return;
    pinged.current = true;
    const supabase = getClient();
    if (!supabase) return;
    supabase.rpc("record_quote_view", { p_token: token }).then(
      () => {},
      () => {}
    );
  }, [token]);

  // If the terms are short enough that there's nothing to scroll, count them
  // as read as soon as the step opens.
  const checkScrolled = useCallback(() => {
    const el = termsBox.current;
    if (!el) return;
    if (el.scrollHeight - el.clientHeight <= 8) setReadToBottom(true);
  }, []);

  useEffect(() => {
    if (mode === "terms") checkScrolled();
  }, [mode, checkScrolled]);

  function onTermsScroll(e) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setReadToBottom(true);
    }
  }

  async function send(kind, extra = {}) {
    const supabase = getClient();
    if (!supabase) {
      setError("Something went wrong — please call or text us instead.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("respond_to_quote", {
      p_token: token,
      p_response: kind,
      p_note: extra.note || null,
      p_signed_name: extra.signedName || null,
      p_signature: extra.signature || null,
      p_user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setBusy(false);
    if (rpcError) {
      setError("Something went wrong — please call or text us instead.");
      return;
    }
    setResponse(kind);
    setMode("done");
  }

  function onAccept() {
    setError("");
    if (hasTerms) {
      setMode("terms");
      return;
    }
    send("accepted");
  }

  // ---------- Done ----------
  if (mode === "done" && response) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 mt-4 text-center">
        <div
          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${BADGE[response]}`}
        >
          <span aria-hidden="true">
            {response === "accepted" ? "✓" : response === "declined" ? "–" : "!"}
          </span>
        </div>
        <p className="font-bold mt-3">{HEADLINE[response]}</p>
        <p className="text-sm text-slate-500 mt-1">{BLURB[response]}</p>
        {response === "accepted" && signedName && (
          <p className="text-xs text-slate-400 mt-2">
            Signed by {signedName}. Keep this link — your signed agreement stays
            here.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMode("choose");
            setError("");
          }}
          className="text-sm text-slate-400 underline mt-4"
        >
          Change my answer
        </button>
      </div>
    );
  }

  // ---------- Read the terms, then sign ----------
  if (mode === "terms") {
    const ready = readToBottom && agreed && signedName.trim() && signature;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
        <h2 className="font-bold text-lg">Terms &amp; Conditions</h2>
        <p className="text-sm text-slate-500 mt-1">
          Please read all the way to the bottom, then sign to accept.
        </p>

        <div
          ref={termsBox}
          onScroll={onTermsScroll}
          className="mt-3 h-64 overflow-y-auto overscroll-contain border border-slate-200 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
        >
          {termsText}
        </div>

        {!readToBottom && (
          <p className="text-xs text-amber-700 font-medium mt-2">
            Scroll to the bottom of the terms to continue.
          </p>
        )}

        <label
          className={`flex items-start gap-3 mt-4 ${
            readToBottom ? "" : "opacity-40"
          }`}
        >
          <input
            type="checkbox"
            disabled={!readToBottom}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 shrink-0"
          />
          <span className="text-sm text-slate-700">
            I have read and agree to the terms and conditions above.
          </span>
        </label>

        <div className={`mt-4 ${agreed ? "" : "opacity-40 pointer-events-none"}`}>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Your full name</span>
            <input
              type="text"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder="First and last name"
              autoComplete="name"
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>

          <div className="mt-4">
            <span className="block text-sm text-slate-600 font-medium mb-1">
              Signature
            </span>
            <SignaturePad onChange={setSignature} />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm font-medium mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() =>
              send("accepted", {
                signedName: signedName.trim(),
                signature,
              })
            }
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-4 rounded-lg disabled:opacity-40"
          >
            {busy ? "Sending…" : "Agree & accept estimate"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("choose");
              setError("");
            }}
            className="px-4 py-3 rounded-lg text-slate-600 font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ---------- Ask for a change ----------
  if (mode === "change") {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
        <label htmlFor="change-note" className="block font-semibold text-sm">
          What would you like changed?
        </label>
        <p className="text-sm text-slate-500 mt-1">
          Tell us what to adjust and we&apos;ll send an updated estimate.
        </p>
        <textarea
          id="change-note"
          rows={5}
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For example: can you add the back patio, and can we do it on a Saturday?"
          className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {error && <p className="text-red-600 text-sm font-medium mt-3">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            disabled={busy || !note.trim()}
            onClick={() => send("change_requested", { note: note.trim() })}
            className="flex-1 bg-orange-600 text-white font-semibold px-4 py-3 rounded-lg disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send request"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("choose");
              setError("");
            }}
            className="px-4 py-3 rounded-lg text-slate-600 font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ---------- The three choices ----------
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
      <p className="text-center text-sm font-medium text-slate-600">
        How would you like to proceed?
      </p>
      {error && (
        <p className="text-red-600 text-sm font-medium text-center mt-3">
          {error}
        </p>
      )}
      <div className="space-y-3 mt-4">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-4 rounded-lg disabled:opacity-40"
        >
          {busy ? "Sending…" : "Accept estimate"}
        </button>
        {hasTerms && (
          <p className="text-center text-xs text-slate-400">
            You&apos;ll read and sign the terms on the next step.
          </p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setMode("change");
            setError("");
          }}
          className="w-full bg-white border border-slate-300 hover:bg-slate-50 font-semibold px-4 py-4 rounded-lg disabled:opacity-40"
        >
          Request a change
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => send("declined")}
          className="w-full text-slate-500 font-medium px-4 py-3 rounded-lg disabled:opacity-40"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
