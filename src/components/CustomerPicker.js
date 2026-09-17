"use client";

import { useEffect, useRef, useState } from "react";

// A searchable customer combobox for use inside a plain HTML form (works
// with Server Actions). Shows a text input for filtering by name/company,
// a dropdown of matches, and carries the selected customer's id in a
// same-named form field so it's a drop-in replacement for a <select>.
export default function CustomerPicker({ customers, name = "customer_id", defaultCustomerId = "", required = false }) {
  const list = customers || [];

  function labelFor(c) {
    return `${c.first_name} ${c.last_name}${c.company ? ` (${c.company})` : ""}`;
  }

  const initial = defaultCustomerId ? list.find((c) => c.id === defaultCustomerId) : null;

  const [query, setQuery] = useState(initial ? labelFor(initial) : "");
  const [selectedId, setSelectedId] = useState(defaultCustomerId || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const hiddenRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current.setCustomValidity("");
    }
  }, [selectedId]);

  const q = query.trim().toLowerCase();
  const filtered = q ? list.filter((c) => labelFor(c).toLowerCase().includes(q)) : list;

  function selectCustomer(c) {
    setSelectedId(c.id);
    setQuery(labelFor(c));
    setOpen(false);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    setSelectedId("");
    setOpen(true);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={hiddenRef}
        type="text"
        name={name}
        value={selectedId}
        required={required}
        tabIndex={-1}
        onChange={() => {}}
        onInvalid={(e) => e.target.setCustomValidity("Please select a customer from the list below.")}
        className="sr-only"
      />
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Search customers by name or company..."
        autoComplete="off"
        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">No customers match.</div>
          )}
          {filtered.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => selectCustomer(c)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 ${
                c.id === selectedId ? "bg-orange-50 font-medium" : ""
              }`}
            >
              {labelFor(c)}
            </button>
          ))}
        </div>
      )}
      {list.length === 0 && (
        <p className="text-xs text-slate-400 mt-1">
          Add a customer on the Customers page first, then they&apos;ll show up here.
        </p>
      )}
    </div>
  );
}
