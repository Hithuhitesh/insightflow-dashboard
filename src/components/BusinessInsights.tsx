import { motion } from "framer-motion";
import { TrendingUp, MapPin, Package, DollarSign } from "lucide-react";
import { ParsedData } from "@/lib/csv-utils";
import { detectNumericColumns, detectCategoryColumns, prepareChartData } from "@/lib/csv-utils";
import { useEffect, useMemo, useState } from "react";

interface BusinessInsightsProps {
  data: ParsedData;
}

type Currency = "USD" | "INR";

function formatAmount(n: number, currency: Currency, usdToInr: number): string {
  let value = n;
  let prefix = "$";

  if (currency === "INR") {
    value = n * usdToInr;
    prefix = "₹";
  }

  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(2)}K`;
  return `${prefix}${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

export function BusinessInsights({ data }: BusinessInsightsProps) {
  const numericCols = useMemo(() => detectNumericColumns(data.headers, data.rows), [data]);
  const categoryCols = useMemo(() => detectCategoryColumns(data.headers, data.rows), [data]);

  // Try to find revenue column (common names)
  const revenueCol = useMemo(() => {
    const revenuePatterns = /^(revenue|sales|amount|total|price|value)$/i;
    return numericCols.find((col) => revenuePatterns.test(col)) || numericCols[0];
  }, [numericCols]);

  // Try to find product and region columns
  const productCol = useMemo(() => {
    const productPatterns = /^(product|item|sku|goods)$/i;
    return categoryCols.find((col) => productPatterns.test(col)) || categoryCols[0];
  }, [categoryCols]);

  const regionCol = useMemo(() => {
    const regionPatterns = /^(region|country|location|area)$/i;
    return categoryCols.find((col) => regionPatterns.test(col)) || categoryCols[1];
  }, [categoryCols]);

  // Currency state + live USD→INR rate
  const [currency, setCurrency] = useState<Currency>("USD");
  const [usdToInr, setUsdToInr] = useState<number>(83); // fallback
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchRate = async () => {
      try {
        setRateLoading(true);
        const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=INR");
        if (!res.ok) return;
        const json = await res.json();
        const rate = json?.rates?.INR;
        if (!cancelled && typeof rate === "number" && rate > 0) {
          setUsdToInr(rate);
        }
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    };
    fetchRate();
    return () => {
      cancelled = true;
    };
  }, []);

  const insights = useMemo(() => {
    if (!revenueCol) {
      return {
        highestRevenueProduct: null,
        highestRevenueRegion: null,
        totalRevenue: 0,
        averageRevenue: 0,
      };
    }

    // Calculate total and average revenue in USD (base)
    const revenueValues = data.rows
      .map((row) => Number(row[revenueCol]) || 0)
      .filter((val) => val > 0);
    const totalRevenue = revenueValues.reduce((a, b) => a + b, 0);
    const averageRevenue = revenueValues.length > 0 ? totalRevenue / revenueValues.length : 0;

    // Find highest revenue product
    let highestRevenueProduct: { name: string; value: number } | null = null;
    if (productCol) {
      const productData = prepareChartData(data.rows, productCol, revenueCol);
      if (productData.length > 0) {
        highestRevenueProduct = productData[0]; // sorted desc
      }
    }

    // Find highest revenue region
    let highestRevenueRegion: { name: string; value: number } | null = null;
    if (regionCol && regionCol !== productCol) {
      const regionData = prepareChartData(data.rows, regionCol, revenueCol);
      if (regionData.length > 0) {
        highestRevenueRegion = regionData[0]; // sorted desc
      }
    }

    return {
      highestRevenueProduct,
      highestRevenueRegion,
      totalRevenue,
      averageRevenue,
    };
  }, [data, revenueCol, productCol, regionCol]);

  if (!revenueCol) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Business Insights</h3>
        <p className="text-sm text-muted-foreground">No revenue-like numeric column available for insights.</p>
      </motion.div>
    );
  }

  const rateLabel =
    currency === "USD"
      ? "USD"
      : rateLoading
      ? "INR (loading rate…)"
      : `INR @ ${usdToInr.toFixed(2)}/$`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Business Insights</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Currency:</span>
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`px-2 py-1 rounded border text-xs ${
              currency === "USD"
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted-foreground"
            }`}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => setCurrency("INR")}
            className={`px-2 py-1 rounded border text-xs ${
              currency === "INR"
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted-foreground"
            }`}
          >
            INR
          </button>
          <span className="text-muted-foreground ml-2">{rateLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insights.highestRevenueProduct && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Top Product</p>
              <p className="text-base font-semibold text-foreground mt-1 truncate">
                {insights.highestRevenueProduct.name}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatAmount(insights.highestRevenueProduct.value, currency, usdToInr)}
              </p>
            </div>
          </div>
        )}

        {insights.highestRevenueRegion && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Top Region</p>
              <p className="text-base font-semibold text-foreground mt-1 truncate">
                {insights.highestRevenueRegion.name}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatAmount(insights.highestRevenueRegion.value, currency, usdToInr)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {formatAmount(insights.totalRevenue, currency, usdToInr)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Average Revenue</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {formatAmount(insights.averageRevenue, currency, usdToInr)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
