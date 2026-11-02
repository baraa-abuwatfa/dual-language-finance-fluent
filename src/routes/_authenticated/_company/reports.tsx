import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { z } from "zod";
import { MonthlyChart } from "@/components/app/charts";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel, StatCard, selectClass } from "@/components/app/ui";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { monthlySeries, totals } from "@/lib/finance/metrics";
import { formatAmount, monthLabel, todayIso } from "@/lib/finance/queries";
import { buildReport, reportTransactionsQuery } from "@/lib/finance/report-model";
import { reportCopy } from "@/lib/finance/report-copy";
import { ReportExport } from "@/components/app/ReportExport";
import { formatPercent } from "@/lib/i18n/format";
import { TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_company/reports")({
  validateSearch: z.object({ year: z.coerce.number().int().min(2000).max(2100).optional(), type: z.enum(["monthly", "annual"]).optional(), month: z.coerce.number().int().min(1).max(12).optional() }),
  head: () => authHead("Financial Reports", "Monthly and annual company financial reports with bilingual PDF downloads."),
  loader: ({ context }) => context.queryClient.ensureQueryData(reportTransactionsQuery(context.company.id)),
  component: Reports,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Reports() {
  const { t, locale } = useAppCopy();
  const { company } = useCompany();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: txs } = useSuspenseQuery(reportTransactionsQuery(company.id));
  const thisYear = Number(todayIso().slice(0, 4));
  const search = Route.useSearch();
  const year = search.year ?? thisYear;
  const type = search.type ?? "annual";
  const month = search.month ?? Number(todayIso().slice(5, 7));
  const years = [...new Set([year, thisYear, thisYear - 1, ...txs.map((x) => Number(x.occurred_on.slice(0, 4)))])].sort((a, b) => b - a);
  const copy = reportCopy[locale];
  const report = useMemo(() => buildReport(txs, { type, year, month }), [txs, type, year, month]);
  const yearTx = txs.filter((x) => x.occurred_on.startsWith(String(year)));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const series = type === "annual" ? monthlySeries(yearTx, months) : monthlySeries(report.records, [report.range.from.slice(0, 7)]);
  const sum = report.totals;
  const fmt = (v: number) => formatAmount(v, company.currency);

  return <>
    <PageHeader title={t.nav.reports} />
    <Panel title={copy.configuration}>
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid min-w-0 gap-1 text-sm font-medium">{copy.type}<select className={`${selectClass} max-w-full`} value={type} onChange={(e) => void navigate({ search: { year, month, type: e.target.value === "monthly" ? "monthly" : "annual" } })}><option value="monthly">{copy.monthly}</option><option value="annual">{copy.annual}</option></select></label>
        <label className="grid gap-1 text-sm font-medium">{t.year}<select className={selectClass} value={year} onChange={(e) => void navigate({ search: { year: Number(e.target.value), type, month } })}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
        {type === "monthly" && <label className="grid gap-1 text-sm font-medium">{t.month}<select className={selectClass} value={month} onChange={(e) => void navigate({ search: { year, type, month: Number(e.target.value) } })}>{months.map((m, i) => <option key={m} value={i + 1}>{monthLabel(m, locale)}</option>)}</select></label>}
        <ReportExport report={report} company={company} locale={locale} />
      </div>
      <p className="num mt-3 text-xs text-muted-foreground">{company.name} · {company.currency} · {report.range.from} — {report.range.to}</p>
    </Panel>
    {report.records.length === 0 ? <Panel><EmptyState text={copy.empty} icon={<BarChart3 />} /></Panel> : <>
      <h2 className="text-lg font-semibold text-navy">{type === "annual" ? t.yearlyReport : copy.monthly} <span className="num">{type === "annual" ? year : monthLabel(report.range.from.slice(0, 7), locale)}</span></h2>
      <section className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.revenue} value={fmt(sum.revenue)} caption={String(year)} icon={<TrendingUp />} />
        <StatCard label={t.expenses} value={fmt(sum.expenses)} caption={String(year)} icon={<TrendingDown />} />
        <StatCard label={t.netProfit} value={fmt(sum.net)} caption={String(year)} tone={sum.net > 0 ? "positive" : sum.net < 0 ? "negative" : "neutral"} icon={<Wallet />} />
        <StatCard label={t.margin} value={sum.margin === null ? "—" : formatPercent(sum.margin).replace("+", "")} caption={String(year)} icon={<Percent />} />
      </section>
      <Panel title={t.monthly}><MonthlyChart data={series} currency={company.currency} /></Panel>
      <Panel title={copy.comparison}>
        {report.hasPrevious ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><thead><tr>{[copy.metric, copy.current, copy.previous, copy.change].map((label) => <th key={label} className="p-2 text-start font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody>{([[t.revenue, sum.revenue, report.analysis.before.revenue, report.analysis.revChange], [t.expenses, sum.expenses, report.analysis.before.expenses, report.analysis.expChange], [t.netProfit, sum.net, report.analysis.before.net, report.analysis.netChange]] as const).map(([label, current, previous, change]) => <tr key={label} className="border-t border-border"><td className="p-2">{label}</td><td className="num p-2">{fmt(current)}</td><td className="num p-2">{fmt(previous)}</td><td className="num p-2">{change === null ? "—" : `${change.toFixed(1)}%`}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">{copy.noPrevious}</p>}
      </Panel>
    </>}
    {yearTx.length > 0 && <>
      {type === "monthly" && <Panel title={`${t.yearlyReport} ${year}`}><div className="grid gap-4 sm:grid-cols-3">{([[t.revenue, totals(yearTx).revenue], [t.expenses, totals(yearTx).expenses], [t.netProfit, totals(yearTx).net]] as const).map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="num mt-1 text-xl font-semibold">{fmt(value)}</p></div>)}</div></Panel>}
      <Panel title={t.monthlyReport}>
        <div className="-mx-4 overflow-x-auto sm:mx-0"><table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="px-4 py-2 text-start font-medium">{t.month}</th><th className="px-4 py-2 text-end font-medium">{t.revenue}</th><th className="px-4 py-2 text-end font-medium">{t.expenses}</th><th className="px-4 py-2 text-end font-medium">{t.netProfit}</th><th className="px-4 py-2 text-end font-medium">{t.margin}</th></tr></thead>
          <tbody className="divide-y divide-border">{report.annual.map((m) => <tr key={m.month} className="hover:bg-background">
            <td className="px-4 py-2.5">{monthLabel(m.month, locale)}</td>
            <td className="num px-4 py-2.5 text-end">{fmt(m.revenue)}</td><td className="num px-4 py-2.5 text-end">{fmt(m.expenses)}</td>
            <td className={`num px-4 py-2.5 text-end font-semibold ${m.net > 0 ? "text-positive" : m.net < 0 ? "text-negative" : ""}`}>{fmt(m.net)}</td>
            <td className="num px-4 py-2.5 text-end text-muted-foreground">{m.margin === null ? "—" : `${m.margin.toFixed(1)}%`}</td>
          </tr>)}</tbody>
        </table></div>
      </Panel>
    </>}
  </>;
}
