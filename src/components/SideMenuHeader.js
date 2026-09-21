"use client";

// The top of the menu drawer: the logo tile and the close button.

export default function SideMenuHeader({ onClose }) {
  return (
    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-navy-800 text-white font-bold flex items-center justify-center text-sm shrink-0">
        JB
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 truncate">Menu</div>
        <div className="text-xs text-slate-400 truncate">Everything in the app</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="ml-auto w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
