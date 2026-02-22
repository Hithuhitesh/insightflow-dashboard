import { motion } from "framer-motion";
import { TrendingUp, Hash, DollarSign, BarChart3, Minus, ArrowUpDown } from "lucide-react";
import { MetricsSummary } from "@/lib/csv-utils";

const icons = [DollarSign, TrendingUp, BarChart3, Hash];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

export function MetricsCards({
  metrics,
  selectedNumericColumn,
  selectedColumnStats,
}: {
  metrics: MetricsSummary;
  selectedNumericColumn?: string | null;
  selectedColumnStats?: { total: number; average: number; min: number; max: number } | null;
}) {
  const baseCards = [
    { label: "Total Records", value: formatNumber(metrics.totalRecords), icon: Hash },
    ...metrics.numericSummaries.slice(0, 3).map((s, i) => ({
      label: `Total ${s.column}`,
      value: formatNumber(s.total),
      icon: icons[i] || BarChart3,
    })),
  ];

  const hasSelectedInBase =
    selectedNumericColumn &&
    metrics.numericSummaries.some((s) => s.column === selectedNumericColumn);
  const extraCards =
    selectedNumericColumn && selectedColumnStats
      ? [
          ...(hasSelectedInBase ? [] : [{ label: `Total ${selectedNumericColumn}`, value: formatNumber(selectedColumnStats.total), icon: BarChart3 as const }]),
          { label: `Avg ${selectedNumericColumn}`, value: formatNumber(selectedColumnStats.average), icon: TrendingUp as const },
          { label: `Max ${selectedNumericColumn}`, value: formatNumber(selectedColumnStats.max), icon: ArrowUpDown as const },
          { label: `Min ${selectedNumericColumn}`, value: formatNumber(selectedColumnStats.min), icon: Minus as const },
        ]
      : [];

  const cards = [...baseCards, ...extraCards];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={`${card.label}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">{card.label}</span>
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <card.icon className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
