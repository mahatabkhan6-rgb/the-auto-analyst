// Lightweight client-side CSV parser (handles quoted fields, commas, newlines).
// Returns an array of row objects keyed by the header row.

export function parseCSV(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(current);
      current = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(current);
      current = "";
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) rows.push(row);
      row = [];
    } else {
      current += char;
    }
  }
  if (current !== "" || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length !== headers.length && values.length === 1 && values[0] === "") continue;
    const obj = {};
    headers.forEach((h, idx) => {
      const raw = values[idx] !== undefined ? values[idx].trim() : "";
      obj[h] = coerceValue(raw);
    });
    data.push(obj);
  }
  return data;
}

function coerceValue(raw) {
  if (raw === "") return "";
  const num = Number(raw);
  if (raw !== "" && !isNaN(num) && /^-?\d+(\.\d+)?$/.test(raw)) return num;
  return raw;
}

// Convert an array of row objects into a compact preview + summary for display.
export function rowsToPreview(rows, maxRows = 8) {
  if (!rows || rows.length === 0) return { headers: [], rows: [] };
  const headers = Object.keys(rows[0]);
  return {
    headers,
    rows: rows.slice(0, maxRows).map((r) => headers.map((h) => r[h]))
  };
}