import { base44 } from "@/api/base44Client";

export async function parseExcelFile(fileUrl) {
  const response = await base44.functions.invoke("parseDatasetFile", {
    file_url: fileUrl
  });
  return response.data;
}