import React from "react";

export default function Hero({ onAnalyze, loading, hasDataset, datasetName }) {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          AI-powered growth diagnostics
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 font-heading">
          AI Growth Analyst
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto font-body">
          Turn Marketing &amp; CRM data into prioritized growth decisions.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-400">
          <span className="h-px w-12 bg-slate-200" />
          <span className="font-mono text-xs uppercase tracking-widest">Upload · Analyze · Act</span>
          <span className="h-px w-12 bg-slate-200" />
        </div>
      </div>
    </section>
  );
}