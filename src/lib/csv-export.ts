import { ParsedData } from "./csv-utils";

/**
 * Exports filtered data as CSV
 */
export function exportFilteredDataAsCSV(
  data: ParsedData,
  filename: string = "insightflow-filtered-data.csv"
): void {
  if (!data || data.rows.length === 0) {
    throw new Error("No data to export");
  }

  const csvHeader = data.headers.join(",");
  const csvRows = data.rows.map((row) =>
    data.headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
  );
  const csvContent = [csvHeader, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
