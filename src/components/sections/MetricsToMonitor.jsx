import React from "react";
import { Gauge } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export default function MetricsToMonitor({ metrics }) {
  if (!metrics || metrics.length === 0) return null;
  return (
    <SectionCard
      icon={Gauge}
      title="Metrics to Monitor"
      subtitle="The most important metrics following the recommended actions"
      number={8}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="flex gap-3 items-start rounded-lg border border-slate-100 p-3">
            <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-900" />
            <div>
              <p className="text-sm font-medium text-slate-900">{m.metric}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.why}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}