import { BarChart3, FileText, Info, LayoutGrid, Receipt, Sparkles } from "lucide-react";

import { LogoMark } from "@/components/brand/Logo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

import { KpiCard } from "./KpiCard";
import { NumberText } from "./NumberText";
import { RevenueChart } from "./RevenueChart";
import { SAMPLE_KPIS } from "./preview-data";

const SIDEBAR_ICONS = [LayoutGrid, FileText, Receipt, BarChart3];

/** Visual-only mockup of the future dashboard. Not interactive, sample data only. */
export function DashboardPreview({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <figure
      className={cn("overflow-hidden rounded-2xl border border-cloud bg-card shadow-preview", className)}
      aria-label={`${t.preview.windowTitle} — ${t.preview.badge}`}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-warm px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-cloud" />
            <span className="h-2.5 w-2.5 rounded-full bg-mist" />
            <span className="h-2.5 w-2.5 rounded-full bg-champagne" />
          </div>
          <span className="hidden truncate text-xs font-medium text-muted-foreground sm:inline">
            {t.preview.windowTitle}
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-champagne bg-champagne-soft px-2.5 py-1 text-[0.7rem] font-semibold text-taupe sm:text-xs">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          {t.preview.badge}
        </span>
      </div>

      <div className="grid md:grid-cols-[11rem_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden flex-col gap-1 border-e border-border bg-background p-3 md:flex" aria-hidden="true">
          <div className="mb-3 flex items-center gap-2 px-2 pt-1">
            <LogoMark className="h-7 w-7" />
            <span className="text-sm font-semibold text-navy" dir="ltr">
              AI CFO
            </span>
          </div>
          {t.preview.sidebar.map((item, i) => {
            const Icon = SIDEBAR_ICONS[i] ?? LayoutGrid;
            return (
              <span
                key={item}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                  i === 0 ? "bg-navy text-on-navy" : "text-steel",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item}
              </span>
            );
          })}
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col gap-3 bg-background p-3 sm:gap-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t.preview.greeting}</p>
              <p className="truncate font-display text-lg font-semibold text-navy sm:text-xl">{t.preview.business}</p>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-steel">
              {t.preview.period}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            {SAMPLE_KPIS.map((kpi) => (
              <KpiCard
                key={kpi.key}
                label={t.preview.kpis[kpi.key]}
                value={kpi.value}
                delta={kpi.delta}
                goodWhenUp={kpi.goodWhenUp}
                spark={kpi.spark}
                caption={t.preview.vsLastMonth}
              />
            ))}
          </div>

          <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <RevenueChart />
            <div className="flex flex-col justify-between gap-4 rounded-xl bg-navy-gradient p-4 text-on-navy sm:p-5">
              <div className="flex flex-col gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-champagne">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {t.preview.insightLabel}
                </span>
                <p className="text-sm leading-relaxed text-on-navy"><NumberText text={t.preview.insightText} />
                </p>
              </div>
              <div className="flex flex-col gap-2" aria-hidden="true">
                <div className="flex items-baseline justify-between text-xs text-on-navy-muted">
                  <span>{t.preview.kpis.netProfit}</span>
                  <span className="num font-semibold text-on-navy">34%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-on-navy/15">
                  <div className="h-full w-[34%] rounded-full bg-champagne" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[0.7rem] text-muted-foreground sm:text-xs">{t.preview.disclaimer}</p>
        </div>
      </div>
    </figure>
  );
}
