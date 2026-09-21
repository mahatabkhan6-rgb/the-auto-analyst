import React from "react";
import { Activity } from "lucide-react";
import SectionCard from "@/components/SectionCard";

const FIELDS = [
  { key: "what_happened", label: "What happened?" },
  { key: "why_it_may_have_happened", label: "Why it may have happened" },
  { key: "what_matters", label: "What matters" },
  { key: "what_next", label: "What should we do next?" },
  { key: "what_to_test", label: "What should we test?" },
];

export default function ExecutiveDiagnosis({ data }) {
  if (!data) return null;
  return (
    <SectionCard
      icon={Activity}
      title="Executive Diagnosis"
      subtitle="The analyst's read of the dataset"
      number={1}
    >
      <div className="grid gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{f.label}</p>
            <p className="text-sm text-slate-800 leading-relaxed">{data[f.key] || "Not available from the provided data."}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}