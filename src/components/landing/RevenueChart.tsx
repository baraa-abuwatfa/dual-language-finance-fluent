import { useI18n } from "@/lib/i18n/I18nProvider";

import { areaPath, smoothPath } from "./charts";
import { SAMPLE_SERIES } from "./preview-data";

const W = 600;
const H = 200;
const MAX = 55000;
const TICKS = [50000, 37500, 25000, 12500, 0];

export function RevenueChart() {
  const { t } = useI18n();
  const { revenue, expenses } = SAMPLE_SERIES;

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="font-sans text-sm font-semibold text-navy sm:text-base">{t.preview.chartTitle}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-navy" aria-hidden="true" />
            {t.preview.legendRevenue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-champagne" aria-hidden="true" />
            {t.preview.legendExpenses}
          </span>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        {/* Y axis */}
        <div className="flex h-36 flex-col justify-between pb-0 text-[0.65rem] text-muted-foreground sm:h-48 sm:text-xs" aria-hidden="true">
          {TICKS.map((tick) => (
            <span key={tick} className="num -translate-y-1/2 first:translate-y-0 last:translate-y-0 leading-none">
              {tick === 0 ? "$0" : `$${tick / 1000}k`}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* grid lines */}
          <div className="absolute inset-0 flex h-36 flex-col justify-between sm:h-48" aria-hidden="true">
            {TICKS.map((tick) => (
              <span key={tick} className="h-px w-full bg-border" />
            ))}
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={t.preview.chartTitle}
            className="relative h-36 w-full animate-clip-reveal overflow-visible sm:h-48 rtl:-scale-x-100"
          >
            <defs>
              <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--steel)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--steel)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="exp-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--champagne)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--champagne)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath(revenue, W, H, MAX)} fill="url(#rev-fill)" />
            <path d={areaPath(expenses, W, H, MAX)} fill="url(#exp-fill)" />
            <path
              d={smoothPath(expenses, W, H, MAX)}
              fill="none"
              stroke="var(--taupe)"
              strokeWidth="2.25"
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={smoothPath(revenue, W, H, MAX)}
              fill="none"
              stroke="var(--navy)"
              strokeWidth="2.75"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* X axis — flex follows the document direction, matching the mirrored chart */}
          <div className="mt-2 flex justify-between text-[0.65rem] text-muted-foreground sm:text-xs" aria-hidden="true">
            {t.preview.months.map((m) => (
              <span key={m} className="w-0 whitespace-nowrap text-center first:text-start last:text-end [&:not(:first-child):not(:last-child)]:flex [&:not(:first-child):not(:last-child)]:justify-center">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
