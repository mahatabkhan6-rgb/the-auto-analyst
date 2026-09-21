import React from "react";
import ExecutiveDiagnosis from "@/components/sections/ExecutiveDiagnosis";
import KeyMetrics from "@/components/sections/KeyMetrics";
import Patterns from "@/components/sections/Patterns";
import ChannelPerformance from "@/components/sections/ChannelPerformance";
import CohortAnalysis from "@/components/sections/CohortAnalysis";
import CampaignPerformance from "@/components/sections/CampaignPerformance";
import RecommendedActions from "@/components/sections/RecommendedActions";
import RecommendedExperiment from "@/components/sections/RecommendedExperiment";
import DataQuality from "@/components/sections/DataQuality";

export default function AnalysisReport({ analysis }) {
  if (!analysis) return null;
  return (
    <div className="max-w-5xl mx-auto px-6 pb-20 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-sm font-medium text-slate-500">Analysis complete</p>
      </div>

      <ExecutiveDiagnosis data={analysis.executive_diagnosis} />
      <KeyMetrics metrics={analysis.key_metrics} />
      <Patterns patterns={analysis.patterns} />
      <ChannelPerformance data={analysis.channel_analysis} />
      <CohortAnalysis data={analysis.cohort_analysis} />
      <CampaignPerformance data={analysis.campaign_analysis} />
      <RecommendedActions actions={analysis.recommendations} />
      <RecommendedExperiment data={analysis.recommended_experiment} />
      <DataQuality data={analysis.data_quality} />
    </div>
  );
}