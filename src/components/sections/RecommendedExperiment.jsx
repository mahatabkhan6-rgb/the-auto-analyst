import React from "react";
import { FlaskConical } from "lucide-react";
import SectionCard from "@/components/SectionCard";

const FIELDS = [
  { label: "Hypothesis", key: "hypothesis", full: true },
  { label: "Target audience", key: "audience" },
  { label: "Intervention", key: "intervention" },
  { label: "Control", key: "control" },
  { label: "Primary KPI", key: "primary_kpi", highlight: true },
  { label: "Secondary KPI", key: "secondary_kpi" },
  { label: "Success threshold", key: "success_threshold" },
  { label: "Duration / window", key: "duration" },
];

export default function RecommendedExperiment({ data }) {
  if (!data) return null;
  return (
    <SectionCard
      icon={FlaskConical}
      title="Recommended Experiment"
      subtitle="A test of the strongest unresolved opportunity"
      number={8}
    >
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.full || f.highlight ? "sm:col-span-2" : ""}>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{f.label}</p>
            <p className={`text-sm leading-relaxed ${f.highlight ? "text-slate-900 font-medium" : "text-slate-700"}`}>{data[f.key]}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}