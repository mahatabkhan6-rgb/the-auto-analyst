// Realistic sample marketing/CRM growth dataset for the demo.
// Flat table with 120 rows — each row is a channel × campaign × cohort record
// with full funnel metrics (spend, impressions, clicks, visitors, users, signups,
// activated, converted, revenue, retained_30d). The analysis engine classifies
// these flat rows into channel, campaign, and cohort views automatically.
import sampleRows from "@/lib/sampleDatasetData.json";

export const SAMPLE_DATASET = sampleRows;
export const SAMPLE_DATASET_NAME = "Careem Growth Dataset (Sample)";
export const SAMPLE_PREVIEW_ROWS = sampleRows.slice(0, 8);