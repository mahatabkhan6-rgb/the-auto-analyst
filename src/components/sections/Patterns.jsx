import React from "react";
import { Lightbulb } from "lucide-react";
import SectionCard from "@/components/SectionCard";

const labelTone = (label) => {
  const l = String(label || "").toUpperCase();
  if (l === "OBSERVED") return "bg-emerald-50 text-emerald-700";
  if (l === "INFERRED") return "bg-amber-50 text-amber-700";
  if (l === "HYPOTHESIS") return "bg-violet-50 text-violet-700";
  if (l === "RECOMMENDATION") return "bg-blue-50 text-blue-700";
  return "bg-slate-200 text-slate-600";
};

export default function Patterns({ patterns }) {
  if (!patterns || patterns.length === 0) return null;
  return (
    <SectionCard
      icon={Lightbulb}
      title="Key Patterns"
      subtitle="The most meaningful movements the AI detected"
      number={3}
    >
      <div className="grid gap-4">
        {patterns.map((p, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-2 mb-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center justify-center">{i + 1}</span>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">{p.observation}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 sm:pl-8">
              <Field label="Interpretation" value={p.interpretation} />
              <Field label="Business implication" value={p.implication} />
            </div>
            {p.label && (
              <div className="mt-3 sm:pl-8">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${labelTone(p.label)}`}>{p.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-sm leading-relaxed text-slate-700">{value}</p>
    </div>
  );
}