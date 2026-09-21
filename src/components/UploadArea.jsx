import React, { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Sparkles } from "lucide-react";

export default function UploadArea({
  onFile,
  onLoadSample,
  onAnalyze,
  loading,
  hasDataset,
  datasetName,
  preview
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 bg-white ${
          dragging
            ? "border-slate-900 bg-slate-50 scale-[1.01]"
            : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="px-8 py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-base font-medium text-slate-900">
            Drop your dataset here, or click to browse
          </p>
          <p className="text-sm text-slate-400 mt-1">
            CSV or Excel · marketing, CRM, or lifecycle data
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onLoadSample}
          className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-4 decoration-slate-300"
        >
          or load sample dataset
        </button>
      </div>

      {hasDataset && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{datasetName}</p>
                <p className="text-xs text-slate-400">Dataset validated and ready for analysis</p>
              </div>
            </div>
            <button
              onClick={onAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Analyzing…" : "Analyze Growth"}
            </button>
          </div>
          {preview && preview.rows && preview.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="text-slate-700">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap">{String(cell ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}