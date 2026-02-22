import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/context/DataContext";
import { detectNumericColumns } from "@/lib/csv-utils";
import { sortData } from "@/lib/filter-utils";

export function DataTableView() {
  const { data } = useData();
  const [search, setSearch] = useState("");
  const [filterCol, setFilterCol] = useState<string>("");
  const [filterVal, setFilterVal] = useState<string>("");
  const [sortCol, setSortCol] = useState<string>("__none__");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const numericCols = useMemo(() => (data ? detectNumericColumns(data.headers, data.rows) : []), [data]);

  const filterOptions = useMemo(() => {
    if (!data || !filterCol) return [];
    const unique = [...new Set(data.rows.map((r) => r[filterCol]))].filter(Boolean).sort();
    return unique.slice(0, 50);
  }, [data, filterCol]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.rows;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => Object.values(r).some((v) => v?.toLowerCase().includes(q)));
    }
    if (filterCol && filterVal) {
      rows = rows.filter((r) => r[filterCol] === filterVal);
    }
    return rows;
  }, [data, search, filterCol, filterVal]);

  const sorted = useMemo(() => {
    if (!data || filtered.length === 0) return filtered;
    if (sortCol === "__none__" || !data.headers.includes(sortCol)) return filtered;
    const sortedData = sortData({ headers: data.headers, rows: filtered }, sortCol, sortOrder);
    return sortedData.rows;
  }, [data, filtered, sortCol, sortOrder]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No data loaded</p>
        <p className="text-sm mt-1">Upload a CSV file to view data here</p>
      </div>
    );
  }

  const exportCSV = () => {
    if (!data || filtered.length === 0) return;
    const csvHeader = data.headers.join(",");
    const csvRows = sorted.map((row) =>
      data.headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "insightflow-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sorted.length} records`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Explorer</h2>
          <p className="text-muted-foreground mt-1">{sorted.length} records</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={sorted.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search all columns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Select value={filterCol} onValueChange={(v) => { setFilterCol(v); setFilterVal(""); setPage(0); }}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {data.headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterCol && (
            <Select value={filterVal} onValueChange={(v) => { setFilterVal(v); setPage(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Value..." />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {numericCols.length > 0 && (
            <>
              <Select value={sortCol} onValueChange={(v) => { setSortCol(v); setPage(0); }}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No sort</SelectItem>
                  {numericCols.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sortCol !== "__none__" && (
                <Button variant="outline" size="sm" onClick={() => { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); setPage(0); }}>
                  {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {data.headers.map((h) => (
                  <TableHead key={h} className="whitespace-nowrap font-semibold text-xs uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  {data.headers.map((h) => (
                    <TableCell key={h} className="whitespace-nowrap text-sm">{row[h]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">
              Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
