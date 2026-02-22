import { ParsedData } from "./csv-utils";
import { detectCategoryColumns } from "./csv-utils";

/**
 * Detects columns that might be Region, Product, or Category based on common naming patterns
 */
export function detectFilterColumns(headers: string[], rows: Record<string, string>[]): {
  region?: string;
  product?: string;
  category?: string;
} {
  const result: { region?: string; product?: string; category?: string } = {};
  
  // Common patterns for these columns (case-insensitive)
  const regionPatterns = /^(region|country|location|area|territory|zone)$/i;
  const productPatterns = /^(product|item|sku|goods|merchandise)$/i;
  const categoryPatterns = /^(category|type|class|group|segment|division)$/i;
  
  headers.forEach((header) => {
    const lowerHeader = header.toLowerCase().trim();
    if (regionPatterns.test(lowerHeader) && !result.region) {
      result.region = header;
    } else if (productPatterns.test(lowerHeader) && !result.product) {
      result.product = header;
    } else if (categoryPatterns.test(lowerHeader) && !result.category) {
      result.category = header;
    }
  });
  
  return result;
}

/** Get list of categorical columns suitable for generic filters (any CSV) */
export function getFilterableCategoricalColumns(headers: string[], rows: Record<string, string>[]): string[] {
  return detectCategoryColumns(headers, rows);
}

/** Generic filter: filter rows by a map of column -> selected value (value "__all__" means no filter) */
export function filterDataGeneric(
  data: ParsedData,
  filters: Record<string, string>
): ParsedData {
  let rows = [...data.rows];
  Object.entries(filters).forEach(([column, value]) => {
    if (!column || value === "__all__") return;
    rows = rows.filter((row) => row[column] === value);
  });
  return { headers: data.headers, rows };
}

/**
 * Gets unique values for a column
 */
export function getUniqueValues(rows: Record<string, string>[], column: string): string[] {
  if (!column) return [];
  const unique = [...new Set(rows.map((r) => r[column]).filter(Boolean))].sort();
  return unique;
}

/**
 * Filters data based on Region, Product, and Category filters
 * filters object contains the selected values, not column names
 */
export function filterData(
  data: ParsedData,
  filters: { region?: string; product?: string; category?: string },
  filterColumns: { region?: string; product?: string; category?: string }
): ParsedData {
  let filteredRows = [...data.rows];
  
  if (filters.region && filterColumns.region) {
    filteredRows = filteredRows.filter((row) => row[filterColumns.region!] === filters.region);
  }
  
  if (filters.product && filterColumns.product) {
    filteredRows = filteredRows.filter((row) => row[filterColumns.product!] === filters.product);
  }
  
  if (filters.category && filterColumns.category) {
    filteredRows = filteredRows.filter((row) => row[filterColumns.category!] === filters.category);
  }
  
  return {
    headers: data.headers,
    rows: filteredRows,
  };
}

/** Sort rows by a column (numeric or string) */
export function sortData(
  data: ParsedData,
  sortByColumn: string | null,
  order: "asc" | "desc"
): ParsedData {
  if (!sortByColumn || !data.headers.includes(sortByColumn)) return data;
  const rows = [...data.rows].sort((a, b) => {
    const aVal = a[sortByColumn];
    const bVal = b[sortByColumn];
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return order === "asc" ? aNum - bNum : bNum - aNum;
    }
    const aStr = String(aVal ?? "");
    const bStr = String(bVal ?? "");
    return order === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
  return { headers: data.headers, rows };
}
