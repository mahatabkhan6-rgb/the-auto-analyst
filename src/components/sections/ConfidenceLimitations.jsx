import React from "react";
import { ShieldCheck } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export default function ConfidenceLimitations({ data }) {
  if (!data) return null;
  const blocks = [
    { label: "Strong Evidence", items: data.strong_evidence, tone: "emerald" },
    { label: "Directional Conclusions", items: data.directional_conclusions, tone: "amber" },
    { label: "Additional Data That Would Improve This Analysis", items: data.additional_data_needed, tone: "slate" }
  ];
  const toneMap = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    slate: "bg-slate-50 border-slate-100 text-slate-700"
  };
  return (
    <SectionCard
      icon={ShieldCheck}
      title="Confidence & Limitations"
      subtitle="Strong evidence vs. directional conclusions"
      number={9}
    >
      <div className="grid gap-4">
        {blocks.map((b) => (
          <div key={b.label} className={`rounded-xl border p-4 ${toneMap[b.tone]}`}>
            <p className="text-xs font-medium uppercase tracking-wider mb-3 opacity-80">{b.label}</p>
            {b.items && b.items.length > 0 ? (
              <ul className="space-y-2">
                {b.items.map((item, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm opacity-60">None identified.</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}