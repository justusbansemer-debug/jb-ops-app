"use client";

// The three buttons at the bottom of a customer's estimate page, plus the
// "they opened it" ping. Both talk to the database through the locked-down
// functions in supabase/estimate-links.sql — nothing else is reachable
// from here.
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

export default function EstimateActions({ token, initialResponse }) {
  const [response, setResponse] = useState(initialResponse || null);
  const [mode, setMode] = useState(initialResponse ? "done" : "choose");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pinged = useRef(false);

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

  async function send(kind, message) {
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
      p_note: message || null,
    });
    setBusy(false);
    if (rpcError) {
      setError("Something went wrong — please call or text us instead.");
      return;
    }
    setResponse(kind);
    setMode("done");
  }

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
            onClick={() => send("change_requested", note.trim())}
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
          onClick={() => send("accepted")}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-4 rounded-lg disabled:opacity-40"
        >
          {busy ? "Sending…" : "Accept estimate"}
        </button>
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
