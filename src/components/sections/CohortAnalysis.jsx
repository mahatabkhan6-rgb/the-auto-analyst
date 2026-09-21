import React from "react";
import { Users } from "lucide-react";
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

export default function CohortAnalysis({ data }) {
  if (!data) return null;
  const cohorts = data.cohorts || [];
  const insights = data.insights || [];
  const trend = data.trend;
  const revenueLabel = (cohorts[0] && cohorts[0].revenue_label) || "Revenue per Signup";

  return (
    <SectionCard
      icon={Users}
      title="Cohort Analysis"
      subtitle="One summary row per cohort month — the AI's read below"
      number={5}
    >
      {data.summary && <p className="text-sm text-slate-500 leading-relaxed mb-4">{data.summary}</p>}

      {trend && (
        <div className="rounded-xl border border-slate-100 p-4 mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Cohort Trend ({trend.from} → {trend.to})</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <TrendCell label="Activation" from={trend.activation.from} to={trend.activation.to} />
            <TrendCell label="Conversion" from={trend.conversion.from} to={trend.conversion.to} />
            <TrendCell label="30-day Retention" from={trend.retention_30d.from} to={trend.retention_30d.to} />
            <TrendCell label={trend.revenue_per_signup.label} from={trend.revenue_per_signup.from} to={trend.revenue_per_signup.to} />
          </div>
        </div>
      )}

      {cohorts.length > 0 && (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="font-medium px-3 py-2">Cohort</th>
                <th className="font-medium px-3 py-2 text-right">Signups</th>
                <th className="font-medium px-3 py-2 text-right">Activation</th>
                <th className="font-medium px-3 py-2 text-right">Conversion</th>
                <th className="font-medium px-3 py-2 text-right">30-day Retention</th>
                <th className="font-medium px-3 py-2 text-right">Revenue</th>
                <th className="font-medium px-3 py-2 text-right">{revenueLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohorts.map((c, i) => (
                <tr key={i}>
                  <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">{c.cohort}</td>
                  <td className="px-3 py-3 text-slate-600 font-mono text-xs text-right whitespace-nowrap">{fmtNum(c.signups)}</td>
                  <td className="px-3 py-3 text-slate-700 font-mono text-xs text-right whitespace-nowrap">{c.activation_rate}</td>
                  <td className="px-3 py-3 text-slate-700 font-mono text-xs text-right whitespace-nowrap">{c.conversion_rate}</td>
                  <td className="px-3 py-3 text-slate-700 font-mono text-xs text-right whitespace-nowrap">
                    {c.retention_30d === "Not yet mature" ? <span className="text-amber-600 italic">Not yet mature</span> : c.retention_30d === "Maturity unknown" ? <span className="text-slate-400 italic">Unknown</span> : c.retention_30d}
                  </td>
                  <td className="px-3 py-3 text-slate-600 font-mono text-xs text-right whitespace-nowrap">{fmtMoney(c.revenue)}</td>
                  <td className="px-3 py-3 text-slate-700 font-mono text-xs text-right whitespace-nowrap">{c.revenue_per_signup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {insights.length > 0 && (
        <div className="mt-5">
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
    </SectionCard>
  );
}

function TrendCell({ label, from, to }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-mono text-slate-900">{from} → {to}</p>
    </div>
  );
}