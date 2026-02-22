import { motion } from "framer-motion";
import { useData } from "@/context/DataContext";
import { MetricsCards } from "@/components/MetricsCards";
import { BusinessInsights } from "@/components/BusinessInsights";
import { InsightsSection } from "@/components/InsightsSection";
import { computeMetrics, detectCategoryColumns, detectNumericColumns, prepareChartData } from "@/lib/csv-utils";
import { detectFilterColumns, getUniqueValues, filterData } from "@/lib/filter-utils";
import { exportChartAsPNG } from "@/lib/chart-export";
import { exportFilteredDataAsCSV } from "@/lib/csv-export";
import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Upload, ArrowRight, Download, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const COLORS = ["hsl(172,66%,50%)", "hsl(217,91%,60%)", "hsl(262,83%,58%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)"];

export default function DashboardPage() {
  const { data, fileName, setData, setFileName } = useData();
  const navigate = useNavigate();
  
  // Fallback: Try to load from localStorage if data is null
  useEffect(() => {
    if (!data) {
      try {
        const stored = localStorage.getItem("insightflow_data");
        const storedFileName = localStorage.getItem("insightflow_data_filename");
        console.log("DashboardPage: Checking localStorage", { hasStored: !!stored, fileName: storedFileName });
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
            console.log("DashboardPage: Loading data from localStorage", { headers: parsed.headers.length, rows: parsed.rows.length });
            setData(parsed);
            if (storedFileName) {
              setFileName(storedFileName);
            }
          } else {
            console.warn("DashboardPage: Invalid data structure in localStorage", parsed);
          }
        } else {
          console.log("DashboardPage: No data in localStorage");
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    } else {
      console.log("DashboardPage: Data already loaded", { headers: data.headers?.length, rows: data.rows?.length, fileName });
    }
  }, [data, setData, setFileName]); // Re-check when data changes

  // Filter state - use "__all__" instead of empty string for "All" option
  const [regionFilter, setRegionFilter] = useState<string>("__all__");
  const [productFilter, setProductFilter] = useState<string>("__all__");
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [selectedNumericCol, setSelectedNumericCol] = useState<string>("");
  const [selectedCategoryCol, setSelectedCategoryCol] = useState<string>("");
  const [chartSortOrder, setChartSortOrder] = useState<"asc" | "desc">("desc");

  // Detect filter columns
  const filterColumns = useMemo(() => {
    if (!data) return { region: undefined, product: undefined, category: undefined };
    return detectFilterColumns(data.headers, data.rows);
  }, [data]);

  // Get filter options
  const regionOptions = useMemo(() => {
    if (!data || !filterColumns.region) return [];
    return getUniqueValues(data.rows, filterColumns.region);
  }, [data, filterColumns.region]);

  const productOptions = useMemo(() => {
    if (!data || !filterColumns.product) return [];
    return getUniqueValues(data.rows, filterColumns.product);
  }, [data, filterColumns.product]);

  const categoryOptions = useMemo(() => {
    if (!data || !filterColumns.category) return [];
    return getUniqueValues(data.rows, filterColumns.category);
  }, [data, filterColumns.category]);

  // Apply filters
  const filteredData = useMemo(() => {
    if (!data) return null;
    const filters = {
      region: regionFilter !== "__all__" ? regionFilter : undefined,
      product: productFilter !== "__all__" ? productFilter : undefined,
      category: categoryFilter !== "__all__" ? categoryFilter : undefined,
    };
    try {
      const filtered = filterData(data, filters, filterColumns);
      // Ensure filtered data is valid
      if (filtered && Array.isArray(filtered.headers) && Array.isArray(filtered.rows)) {
        return filtered;
      }
      return data; // Fallback to original data if filter fails
    } catch (error) {
      console.error("Error filtering data:", error);
      return data; // Fallback to original data on error
    }
  }, [data, regionFilter, productFilter, categoryFilter, filterColumns]);

  // Use filtered data for metrics and charts
  const activeData = filteredData || data;

  // Generic column detection (any CSV)
  const numericCols = useMemo(() => (activeData ? detectNumericColumns(activeData.headers, activeData.rows) : []), [activeData]);
  const categoryCols = useMemo(() => (activeData ? detectCategoryColumns(activeData.headers, activeData.rows) : []), [activeData]);
  const effectiveNumericCol = selectedNumericCol || numericCols[0] || "";
  const effectiveCategoryCol = selectedCategoryCol || categoryCols[0] || "";

  const metrics = useMemo(() => activeData ? computeMetrics(activeData.headers, activeData.rows) : null, [activeData]);

  const selectedColumnStats = useMemo(() => {
    if (!activeData || !effectiveNumericCol) return null;
    const values = activeData.rows.map((r) => Number(r[effectiveNumericCol])).filter((v) => !isNaN(v));
    if (values.length === 0) return null;
    const total = values.reduce((a, b) => a + b, 0);
    return {
      total,
      average: total / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [activeData, effectiveNumericCol]);

  const quickChart = useMemo(() => {
    if (!activeData || !effectiveCategoryCol || !effectiveNumericCol) return [];
    const chartData = prepareChartData(activeData.rows, effectiveCategoryCol, effectiveNumericCol).slice(0, 8);
    return [...chartData].sort((a, b) => (chartSortOrder === "desc" ? b.value - a.value : a.value - b.value));
  }, [activeData, effectiveCategoryCol, effectiveNumericCol, chartSortOrder]);

  const handleDownloadChart = async () => {
    try {
      await exportChartAsPNG("quick-chart-container", `chart-${fileName || "export"}.png`);
      toast.success("Chart downloaded successfully");
    } catch (error) {
      toast.error("Failed to download chart");
      console.error(error);
    }
  };

  const handleDownloadData = () => {
    if (!filteredData || filteredData.rows.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      exportFilteredDataAsCSV(filteredData, `insightflow-filtered-${fileName || "export"}.csv`);
      toast.success(`Exported ${filteredData.rows.length} records`);
    } catch (error) {
      toast.error("Failed to export data");
      console.error(error);
    }
  };

  // Validate data structure
  const isValidData = data && Array.isArray(data.headers) && Array.isArray(data.rows);

  if (!isValidData) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
          <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
            <Upload className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Welcome to InsightFlow</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Upload a CSV file to unlock powerful analytics, interactive charts, and data insights.</p>
          </div>
          <Button onClick={() => navigate("/upload")} className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Upload CSV <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview for <span className="font-medium text-foreground">{fileName}</span></p>
      </div>

      {/* Column selectors & sorting (generic - any CSV) */}
      {(numericCols.length > 0 || categoryCols.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Columns & sort</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {numericCols.length > 0 && (
              <Select value={effectiveNumericCol} onValueChange={setSelectedNumericCol}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Metric column" />
                </SelectTrigger>
                <SelectContent>
                  {numericCols.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {categoryCols.length > 0 && (
              <Select value={effectiveCategoryCol} onValueChange={setSelectedCategoryCol}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Group by (chart)" />
                </SelectTrigger>
                <SelectContent>
                  {categoryCols.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Chart order:</span>
              <Button variant={chartSortOrder === "asc" ? "secondary" : "outline"} size="sm" onClick={() => setChartSortOrder("asc")}>
                Asc
              </Button>
              <Button variant={chartSortOrder === "desc" ? "secondary" : "outline"} size="sm" onClick={() => setChartSortOrder("desc")}>
                Desc
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters Section */}
      {(filterColumns.region || filterColumns.product || filterColumns.category) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {filterColumns.region && (
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={`Filter by ${filterColumns.region}...`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All {filterColumns.region}s</SelectItem>
                  {regionOptions.map((val) => (
                    <SelectItem key={val} value={val}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterColumns.product && (
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={`Filter by ${filterColumns.product}...`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All {filterColumns.product}s</SelectItem>
                  {productOptions.map((val) => (
                    <SelectItem key={val} value={val}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterColumns.category && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={`Filter by ${filterColumns.category}...`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All {filterColumns.category}s</SelectItem>
                  {categoryOptions.map((val) => (
                    <SelectItem key={val} value={val}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </motion.div>
      )}

      {metrics && (
        <MetricsCards
          metrics={metrics}
          selectedNumericColumn={effectiveNumericCol || null}
          selectedColumnStats={selectedColumnStats}
        />
      )}

      {activeData && <BusinessInsights data={activeData} />}

      {activeData && <InsightsSection data={activeData} numericColumn={effectiveNumericCol || null} />}

      {quickChart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Overview</h3>
            <Button variant="outline" size="sm" onClick={handleDownloadChart}>
              <Download className="h-4 w-4 mr-2" />
              Download Chart as PNG
            </Button>
          </div>
          <div id="quick-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quickChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {quickChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {filteredData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <Button variant="outline" onClick={handleDownloadData} disabled={!filteredData || filteredData.rows.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download Filtered Data as CSV
          </Button>
        </motion.div>
      )}
    </div>
  );
}
