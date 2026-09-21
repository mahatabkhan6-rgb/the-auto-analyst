import React from "react";
import { TrendingUp } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export default function GrowthSignals({ signals }) {
  if (!signals || signals.length === 0) return null;
  return (
    <SectionCard
      icon={TrendingUp}
      title="Top Growth Signals"
      subtitle="The most material patterns, ordered by importance"
      number={2}
    >
      <div className="grid gap-4">
        {signals.map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-2 mb-4">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <h3 className="text-sm font-semibold text-slate-900 leading-relaxed">{s.observation}</h3>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Evidence" value={s.evidence} mono />
              <Field label="Business impact" value={s.business_impact} />
              <Field label="Likely driver (inference)" value={s.likely_driver} inference />
              <Field label="Recommendation" value={s.recommendation} />
              <Field label="KPI to monitor" value={s.kpi} />
            </dl>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function Field({ label, value, mono, inference }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{label}</dt>
      <dd
        className={`text-sm leading-relaxed ${
          inference ? "text-slate-600 italic" : "text-slate-800"
        } ${mono ? "font-mono text-slate-700" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}