import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import * as XLSX from 'npm:xlsx@0.18.5';

// Parses an uploaded spreadsheet (xlsx/xls/csv) into JSON rows deterministically
// using SheetJS. Reads whatever columns the file's header row contains — the
// growth engine normalises column names downstream. No LLM extraction involved.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const fileUrl = body?.file_url;
    if (!fileUrl) {
      return Response.json({ error: "No file_url provided" }, { status: 400 });
    }

    // Download the uploaded file bytes
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      return Response.json({ error: "Could not download the uploaded file" }, { status: 400 });
    }
    const ab = await fileRes.arrayBuffer();

    let wb;
    try {
      wb = XLSX.read(new Uint8Array(ab), { type: "array" });
    } catch (parseErr) {
      return Response.json({ error: "The file is not a valid Excel or CSV spreadsheet." }, { status: 422 });
    }

    // Collect rows from every sheet, using the first row of each as headers
    const allRows = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
      for (const r of rows) allRows.push(r);
    }

    if (!allRows.length) {
      return Response.json({ error: "No rows found in the spreadsheet." }, { status: 422 });
    }

    return Response.json({ rows: allRows });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to parse file" }, { status: 500 });
  }
}