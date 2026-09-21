import React, { useState } from "react";
import { BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import SectionCard from "@/components/SectionCard";

const labelTone = (label) => {
  const l = String(label || "").toUpperCase();
  if (l === "OBSERVED") return "bg-emerald-50 text-emerald-700";
  if (l === "INFERRED") return "bg-amber-50 text-amber-700";
  if (l === "HYPOTHESIS") return "bg-violet-50 text-violet-700";
  if (l === "RECOMMENDATION") return "bg-blue-50 text-blue-700";
  return "bg-slate-200 text-slate-600";
};
const fmtNum = (n) => (n === null || n === undefined || n === "n/a") ? "—" : Math.round(n).toLocaleString();
const fmtMoney = (n) => (n === null || n === undefined || n === "n/a") ? "—" : `$${Math.round(n).toLocaleString()}`;

export default function ChannelPerformance({ data }) {
  const [showTable, setShowTable] = useState(false);
  if (!data) return null;
  const channels = data.channels || [];
  const insights = data.insights || [];

  return (
    <SectionCard
      icon={BarChart3}
      title="Channel Analysis"
      subtitle="One row per channel — the AI's read below"
      number={4}
    >
      {data.summary && <p className="text-sm text-slate-500 leading-relaxed mb-4">{data.summary}</p>}

      {insights.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">AI Insights</p>
          <div className="grid gap-3">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-medium flex items-center justify-center">{i + 1}</span>
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">{ins.observation}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 sm:pl-7">
                  <p className="text-sm text-slate-600 leading-relaxed"><span className="text-xs text-slate-400 uppercase tracking-wider block mb-0.5">Interpretation</span>{ins.interpretation}</p>
                  <p className="text-sm text-slate-600 leading-relaxed"><span className="text-xs text-slate-400 uppercase tracking-wider block mb-0.5">Business implication</span>{ins.business_implication}</p>
                </div>
                {ins.label && <div className="mt-2 sm:pl-7"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${labelTone(ins.label)}`}>{ins.label}</span></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {channels.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowTable((v) => !v)} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            {showTable ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {showTable ? "Hide" : "Show"} channel detail table ({channels.length} channels)
          </button>
          {showTable && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Channel</th>
                    <th className="text-right font-medium px-3 py-2">Spend</th>
                    <th className="text-right font-medium px-3 py-2">Signups</th>
                    <th className="text-right font-medium px-3 py-2">Converted</th>
                    <th className="text-right font-medium px-3 py-2">Revenue</th>
                    <th className="text-right font-medium px-3 py-2">CAC</th>
                    <th className="text-right font-medium px-3 py-2">ROAS</th>
                    <th className="text-right font-medium px-3 py-2">Activation</th>
                    <th className="text-right font-medium px-3 py-2">Conversion</th>
                    <th className="text-right font-medium px-3 py-2">30d Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {channels.map((c, i) => (
                    <tr key={i} className="text-slate-700">
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-900">{c.channel}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{fmtMoney(c.total_spend)}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{fmtNum(c.total_signups)}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{fmtNum(c.total_converted)}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{fmtMoney(c.total_revenue)}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{c.cac}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{c.roas}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{c.activation_rate}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{c.conversion_rate}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{c.retention_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}