import Papa from "papaparse";

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error: (error) => reject(error),
    });
  });
}

export function detectNumericColumns(headers: string[], rows: Record<string, string>[]): string[] {
  return headers.filter((header) => {
    const sample = rows.slice(0, 10);
    return sample.every((row) => {
      const val = row[header];
      return val === "" || val === undefined || !isNaN(Number(val));
    });
  });
}

export function detectCategoryColumns(headers: string[], rows: Record<string, string>[]): string[] {
  return headers.filter((header) => {
    const uniqueValues = new Set(rows.map((row) => row[header]));
    return uniqueValues.size <= 20 && uniqueValues.size > 1;
  });
}

/** Detect columns that look like dates (ISO, common formats) */
export function detectDateColumns(headers: string[], rows: Record<string, string>[]): string[] {
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /^\d{1,2}-\d{1,2}-\d{2,4}/,
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  ];
  return headers.filter((header) => {
    const sample = rows.slice(0, Math.min(20, rows.length)).map((r) => String(r[header] || "").trim());
    return sample.every((val) => {
      if (!val) return true;
      const asNum = Number(val);
      if (!isNaN(asNum) && val.length <= 8) return false;
      return datePatterns.some((p) => p.test(val)) || !isNaN(Date.parse(val));
    });
  });
}

export interface MetricsSummary {
  totalRecords: number;
  numericSummaries: {
    column: string;
    total: number;
    average: number;
    min: number;
    max: number;
  }[];
}

export function computeMetrics(headers: string[], rows: Record<string, string>[]): MetricsSummary {
  const numericCols = detectNumericColumns(headers, rows);
  const numericSummaries = numericCols.slice(0, 4).map((col) => {
    const values = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
    const total = values.reduce((a, b) => a + b, 0);
    return {
      column: col,
      total,
      average: values.length ? total / values.length : 0,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  });
  return { totalRecords: rows.length, numericSummaries };
}

export function prepareChartData(
  rows: Record<string, string>[],
  categoryCol: string,
  valueCol: string
): { name: string; value: number }[] {
  const grouped: Record<string, number> = {};
  rows.forEach((row) => {
    const key = row[categoryCol] || "Unknown";
    const val = Number(row[valueCol]) || 0;
    grouped[key] = (grouped[key] || 0) + val;
  });
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
}
