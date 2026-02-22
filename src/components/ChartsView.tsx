import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useData } from "@/context/DataContext";
import { detectNumericColumns, detectCategoryColumns, prepareChartData } from "@/lib/csv-utils";
import { exportChartAsPNG } from "@/lib/chart-export";
import { toast } from "sonner";

const CHART_COLORS = [
  "hsl(172, 66%, 50%)",
  "hsl(217, 91%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(330, 80%, 55%)",
  "hsl(195, 85%, 55%)",
];

export function ChartsView() {
  const { data } = useData();
  const numericCols = useMemo(() => data ? detectNumericColumns(data.headers, data.rows) : [], [data]);
  const categoryCols = useMemo(() => data ? detectCategoryColumns(data.headers, data.rows) : [], [data]);

  const [categoryCol, setCategoryCol] = useState("");
  const [valueCol, setValueCol] = useState("");

  const activeCat = categoryCol || categoryCols[0] || "";
  const activeVal = valueCol || numericCols[0] || "";

  const chartData = useMemo(() => {
    if (!data || !activeCat || !activeVal) return [];
    return prepareChartData(data.rows, activeCat, activeVal);
  }, [data, activeCat, activeVal]);

  const handleDownloadChart = async (chartId: string, chartName: string) => {
    try {
      await exportChartAsPNG(chartId, `${chartName}-chart.png`);
      toast.success("Chart downloaded successfully");
    } catch (error) {
      toast.error("Failed to download chart");
      console.error(error);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No data loaded</p>
        <p className="text-sm mt-1">Upload a CSV file to see charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Charts</h2>
        <p className="text-muted-foreground mt-1">Visualize your data with interactive charts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={activeCat} onValueChange={setCategoryCol}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category column" />
          </SelectTrigger>
          <SelectContent>
            {(categoryCols.length ? categoryCols : data.headers).map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeVal} onValueChange={setValueCol}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Value column" />
          </SelectTrigger>
          <SelectContent>
            {numericCols.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {chartData.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
          <p>Select columns to generate charts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Bar Chart</h3>
              <Button variant="outline" size="sm" onClick={() => handleDownloadChart("bar-chart-container", "bar")}>
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
            <div id="bar-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Line Chart</h3>
              <Button variant="outline" size="sm" onClick={() => handleDownloadChart("line-chart-container", "line")}>
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
            <div id="line-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0], r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Distribution</h3>
              <Button variant="outline" size="sm" onClick={() => handleDownloadChart("pie-chart-container", "pie")}>
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
            <div id="pie-chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: "hsl(var(--muted-foreground))" }}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
