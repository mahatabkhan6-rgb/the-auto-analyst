import React from "react";

// Shared section wrapper for consistent executive-friendly styling.
export default function SectionCard({ icon: Icon, title, subtitle, number, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <header className="flex items-start gap-3 px-6 py-5 border-b border-slate-100">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-[18px] h-[18px]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {number && (
              <span className="text-xs font-mono text-slate-400">0{number}</span>
            )}
            <h2 className="text-base font-semibold text-slate-900 font-heading">{title}</h2>
          </div>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}