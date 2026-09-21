import React from "react";
import { Target } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export default function RecommendedActions({ actions }) {
  if (!actions || actions.length === 0) return null;
  return (
    <SectionCard
      icon={Target}
      title="Recommendations"
      subtitle="Derived from detected patterns — relative unless stated"
      number={7}
    >
      <div className="grid gap-4">
        {actions.map((a, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-2 mb-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center justify-center">{i + 1}</span>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">{a.action}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 sm:pl-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Evidence</p>
                <p className="text-sm text-slate-700 leading-relaxed">{a.evidence}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Implication</p>
                <p className="text-sm text-slate-700 leading-relaxed">{a.implication}</p>
              </div>
            </div>
            {a.confidence && (
              <div className="mt-3 sm:pl-8">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${a.confidence === "absolute" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {a.confidence === "absolute" ? "ABSOLUTE" : "RELATIVE (no external benchmark)"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}