import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { ParsedData } from "@/lib/csv-utils";
import {
  detectNumericColumns,
  detectCategoryColumns,
  detectDateColumns,
  prepareChartData,
} from "@/lib/csv-utils";
import { useMemo } from "react";

interface InsightsSectionProps {
  data: ParsedData;
  /** Optional: selected numeric column for insights; if not set, first numeric is used */
  numericColumn?: string | null;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

export function InsightsSection({ data, numericColumn }: InsightsSectionProps) {
  const numericCols = useMemo(() => detectNumericColumns(data.headers, data.rows), [data]);
  const categoryCols = useMemo(() => detectCategoryColumns(data.headers, data.rows), [data]);
  const dateCols = useMemo(() => detectDateColumns(data.headers, data.rows), [data]);

  const activeNumCol = numericColumn ?? numericCols[0] ?? null;

  const insights = useMemo(() => {
    if (!data.rows.length || !activeNumCol) {
      return { type: "none" as const };
    }

    const values = data.rows
      .map((r) => Number(r[activeNumCol]))
      .filter((v) => !isNaN(v));
    if (values.length === 0) {
      return { type: "none" as const };
    }

    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    let topCategory: { name: string; value: number } | null = null;
    if (categoryCols.length > 0) {
      const catCol = categoryCols[0];
      const grouped = prepareChartData(data.rows, catCol, activeNumCol);
      if (grouped.length > 0) topCategory = grouped[0];
    }

    let trend: "up" | "down" | "flat" | null = null;
    if (dateCols.length > 0 && data.rows.length >= 2) {
      const dateCol = dateCols[0];
      const sorted = [...data.rows].sort(
        (a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime()
      );
      const mid = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, mid);
      const secondHalf = sorted.slice(mid);
      const sum1 = firstHalf.reduce((s, r) => s + (Number(r[activeNumCol]) || 0), 0);
      const sum2 = secondHalf.reduce((s, r) => s + (Number(r[activeNumCol]) || 0), 0);
      const avg1 = firstHalf.length ? sum1 / firstHalf.length : 0;
      const avg2 = secondHalf.length ? sum2 / secondHalf.length : 0;
      if (avg2 > avg1 * 1.05) trend = "up";
      else if (avg2 < avg1 * 0.95) trend = "down";
      else trend = "flat";
    }

    return {
      type: "data" as const,
      total,
      average: avg,
      max,
      min,
      topCategory,
      trend,
    };
  }, [data, activeNumCol, categoryCols, dateCols]);

  if (insights.type === "none") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">Not enough data to generate insights.</p>
      </motion.div>
    );
  }

  const lines: string[] = [];
  if (insights.topCategory) {
    lines.push(`Top performing category is ${insights.topCategory.name} (${formatNum(insights.topCategory.value)}).`);
  }
  lines.push(`Highest value observed: ${formatNum(insights.max)}.`);
  lines.push(`Average value is ${formatNum(insights.average)}.`);
  if (insights.trend) {
    if (insights.trend === "up") lines.push("Trend: values are increasing over time.");
    else if (insights.trend === "down") lines.push("Trend: values are decreasing over time.");
    else lines.push("Trend: relatively stable over time.");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Insights</h3>
      </div>
      <div className="space-y-2 text-sm text-foreground">
        {lines.map((line, i) => (
          <p key={i} className="leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
