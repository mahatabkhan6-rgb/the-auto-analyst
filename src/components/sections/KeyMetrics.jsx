import React from "react";
import { BarChart2 } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export default function KeyMetrics({ metrics }) {
  if (!metrics || metrics.length === 0) return null;
  return (
    <SectionCard
      icon={BarChart2}
      title="Key Metrics"
      subtitle="The headline numbers at a glance"
      number={2}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 mb-1">{m.metric}</p>
            <p className="text-xl font-semibold text-slate-900 font-mono">{m.value}</p>
            {m.context && <p className="text-xs text-slate-400 mt-1">{m.context}</p>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}