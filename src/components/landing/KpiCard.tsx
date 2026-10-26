import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatMoney, formatPercent } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

import { smoothPath } from "./charts";

type KpiCardProps = {
  label: string;
  value: number;
  delta: number;
  goodWhenUp: boolean;
  spark: readonly number[];
  caption: string;
};

export function KpiCard({ label, value, delta, goodWhenUp, spark, caption }: KpiCardProps) {
  const up = delta >= 0;
  const good = up === goodWhenUp;
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const range = max - min || 1;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-shadow duration-300 hover:shadow-card sm:p-4">
      <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
      <span className="num truncate text-start text-lg font-bold text-navy sm:text-2xl">{formatMoney(value)}</span>
      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold sm:text-xs",
            good ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative",
          )}
          title={caption}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span className="num">{formatPercent(delta)}</span>
        </span>
        <svg
          viewBox="0 0 64 22"
          className="hidden h-6 w-16 shrink-0 min-[400px]:block rtl:-scale-x-100"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path
            d={smoothPath(spark, { width: 64, height: 20, max: max + range * 0.1, min: min - range * 0.1 })}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            className={good ? "stroke-steel" : "stroke-taupe"}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
