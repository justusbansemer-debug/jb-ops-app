"use client";

// Icons and the grouped link lists the menu drawer renders.

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Icon({ d, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-5 h-5 shrink-0 ${className}`}
    >
      {d}
    </svg>
  );
}

const ICONS = {
  plus: <><path d="M12 5v14M5 12h14" /></>,
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M2.5 19a6.5 6.5 0 0 1 13 0" /><path d="M16 8.5a3 3 0 1 1 3.2 3" /><path d="M15.5 14a6.5 6.5 0 0 1 6 5.5" /></>,
  tools: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
  money: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  gear: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="18" r="2" />
    </>
  ),
  out: <><path d="M15 12H4" /><path d="m8 8-4 4 4 4" /><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></>,
};

export { Chevron, Icon, ICONS };
