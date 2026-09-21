import { base44 } from "@/api/base44Client";

// Client-side wrapper for the growth analysis backend function.
// Keeps the analysis invocation modular — swap this layer to point at a different API.
export async function runGrowthAnalysis(dataset, datasetMeta) {
  const response = await base44.functions.invoke("analyzeGrowth", {
    dataset,
    datasetMeta
  });
  return response.data;
}