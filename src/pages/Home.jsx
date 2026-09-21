import React, { useState } from "react";
import Hero from "@/components/Hero";
import UploadArea from "@/components/UploadArea";
import AnalysisReport from "@/components/AnalysisReport";
import { SAMPLE_DATASET, SAMPLE_DATASET_NAME, SAMPLE_PREVIEW_ROWS } from "@/lib/sampleData";
import { parseCSV, rowsToPreview } from "@/lib/csvParser";
import { runGrowthAnalysis } from "@/lib/growthAnalysis";
import { parseExcelFile } from "@/lib/parseDataset";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const [dataset, setDataset] = useState(null);
  const [datasetName, setDatasetName] = useState("");
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    setError(null);
    setParsing(true);
    setAnalysis(null);
    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const isXlsx = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");
      if (isCsv) {
        const text = await file.text();
        const rows = parseCSV(text);
        if (!rows.length) throw new Error("The CSV file appears to be empty.");
        setDataset(rows);
        setPreview(rowsToPreview(rows));
        setDatasetName(file.name);
      } else if (isXlsx) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        const data = await parseExcelFile(file_url);
        if (!data?.rows || !data.rows.length) throw new Error("Could not extract rows from the Excel file.");
        setDataset(data.rows);
        setPreview(rowsToPreview(data.rows));
        setDatasetName(file.name);
      } else {
        throw new Error("Please upload a CSV or Excel (.xlsx) file.");
      }
    } catch (e) {
      setError(e.message || "Could not read the file.");
      setDataset(null);
      setPreview(null);
      setDatasetName("");
    } finally {
      setParsing(false);
    }
  };

  const loadSample = () => {
    setError(null);
    setAnalysis(null);
    setDataset(SAMPLE_DATASET);
    setPreview(rowsToPreview(SAMPLE_PREVIEW_ROWS));
    setDatasetName(SAMPLE_DATASET_NAME);
  };

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await runGrowthAnalysis(dataset, {
        name: datasetName,
        format: datasetName.toLowerCase().endsWith(".csv") ? "csv"
          : datasetName.toLowerCase().endsWith(".xlsx") || datasetName.toLowerCase().endsWith(".xls") ? "xlsx"
          : "json"
      });
      if (result?.error) throw new Error(result.error);
      setAnalysis(result.analysis);
      setTimeout(() => {
        document.getElementById("analysis-report")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e) {
      setError(e.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              G
            </div>
            <span className="text-sm font-semibold text-slate-900">AI Growth Analyst</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">Marketing · CRM · Lifecycle</span>
        </div>
      </header>

      <Hero
        onAnalyze={handleAnalyze}
        loading={loading}
        hasDataset={!!dataset}
        datasetName={datasetName}
      />

      <div className="pb-10">
        <UploadArea
          onFile={handleFile}
          onLoadSample={loadSample}
          onAnalyze={handleAnalyze}
          loading={loading}
          hasDataset={!!dataset}
          datasetName={datasetName}
          preview={preview}
        />
      </div>

      {(parsing || loading) && (
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 flex flex-col items-center text-center">
            <Loader2 className="w-7 h-7 text-slate-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-700">
              {parsing ? "Validating dataset…" : "Analyzing growth signals…"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {parsing
                ? "Parsing and validating your uploaded data"
                : "Running funnel, channel, cohort and action analysis"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-3xl mx-auto px-6 pb-10">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Something went wrong</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div id="analysis-report">
          <AnalysisReport analysis={analysis} />
        </div>
      )}

      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-slate-400">
            AI Growth Analyst · Analysis is decision support, not autonomous action. Always validate recommendations against business context.
          </p>
        </div>
      </footer>
    </div>
  );
}