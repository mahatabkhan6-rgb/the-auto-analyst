import React from "react";
import { Filter } from "lucide-react";
import SectionCard from "@/components/SectionCard";

const STAGES = [
  { key: "acquisition", label: "Acquisition" },
  { key: "activation", label: "Activation" },
  { key: "conversion", label: "Conversion" },
  { key: "retention", label: "Retention" },
  { key: "monetization", label: "Monetization" }
];

export default function FunnelDiagnosis({ data }) {
  if (!data) return null;
  return (
    <SectionCard
      icon={Filter}
      title="Funnel Diagnosis"
      subtitle="Acquisition → Activation → Conversion → Retention → Monetization"
      number={3}
    >
      <div className="grid gap-3">
        {STAGES.map((stage, i) => (
          <div key={stage.key} className="flex gap-4 items-start">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 text-xs font-medium flex items-center justify-center">
                {i + 1}
              </div>
              {i < STAGES.length - 1 && <div className="w-px h-8 bg-slate-100 mt-1" />}
            </div>
            <div className="flex-1 pb-2">
              <p className="text-sm font-semibold text-slate-900 mb-1">{stage.label}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{(data.stages?.[stage.key] ?? data[stage.key]) || "Not available from the provided data."}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Funnel Summary</p>
        <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
      </div>
    </SectionCard>
  );
}