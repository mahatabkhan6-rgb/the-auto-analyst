import React from "react";
import { Database } from "lucide-react";
import SectionCard from "@/components/SectionCard";

export default function DataQuality({ data }) {
  if (!data) return null;
  const rows = data.row_counts || {};
  const detected = data.fields_detected || [];
  const missing = data.fields_missing || [];
  const issues = data.data_quality_issues || [];
  const checks = data.validation_checks || [];

  return (
    <SectionCard
      icon={Database}
      title="Data Quality & Validation"
      subtitle="What was detected, what's missing, and what passed validation"
      number={9}
    >
      <div className="grid gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Available fields ({detected.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {detected.length === 0 && <span className="text-sm text-slate-400">none</span>}
              {detected.map((f) => (
                <span key={f.canonical} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-mono" title={`Original column: ${f.original}`}>{f.canonical}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Missing fields ({missing.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {missing.length === 0 && <span className="text-sm text-slate-400">none</span>}
              {missing.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-mono">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-700 mb-2">Data quality issues</p>
            <ul className="space-y-1">
              {issues.map((iss, i) => (
                <li key={i} className="text-sm text-amber-700 flex gap-2"><span className="shrink-0">•</span><span>{iss}</span></li>
              ))}
            </ul>
          </div>
        )}

        {checks.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Validation checks</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                  <span className={`shrink-0 w-2 h-2 rounded-full ${c.status === "pass" ? "bg-emerald-500" : c.status === "n/a" ? "bg-slate-300" : "bg-red-500"}`} />
                  <span className="text-xs text-slate-600 flex-1">{c.check}</span>
                  <span className={`text-[10px] font-medium uppercase ${c.status === "pass" ? "text-emerald-600" : c.status === "n/a" ? "text-slate-400" : "text-red-600"}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.notes && (
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-600 leading-relaxed">{data.notes}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}