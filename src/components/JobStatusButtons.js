"use client";

import { useTransition } from "react";

// Inline quick-action buttons for advancing a job's status without leaving
// the Today view — built for a phone in hand on a jobsite, not a full edit
// form. Each tap calls the server action passed in via `action`.
export default function JobStatusButtons({ action, id, status }) {
  const [isPending, startTransition] = useTransition();

  function set(newStatus) {
    startTransition(() => action(id, newStatus));
  }

  if (status === "Scheduled") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => set("In Progress")}
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? "…" : "Start Job"}
      </button>
    );
  }

  if (status === "In Progress") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => set("Completed")}
        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? "…" : "Mark Complete"}
      </button>
    );
  }

  return null;
}
