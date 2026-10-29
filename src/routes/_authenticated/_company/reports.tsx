import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { z } from "zod";
import { MonthlyChart } from "@/components/app/charts";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel, StatCard, selectClass } from "@/components/app/ui";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { monthlySeries, totals } from "@/lib/finance/metrics";
import { formatAmount, monthLabel, todayIso, transactionsQuery } from "@/lib/finance/queries";
import { formatPercent } from "@/lib/i18n/format";
import { TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_company/reports")({
  validateSearch: z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() }),
  head: () => authHead("Reports", "Monthly and yearly financial reports for your company."),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery(context.company.id)),
  component: Reports,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Reports() {
  const { t, locale } = useAppCopy();
  const { company } = useCompany();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: txs } = useSuspenseQuery(transactionsQuery(company.id));
  const thisYear = Number(todayIso().slice(0, 4));
  const years = [...new Set([thisYear, ...txs.map((x) => Number(x.occurred_on.slice(0, 4)))])].sort((a, b) => b - a);
  const year = Route.useSearch().year ?? thisYear;
  const yearTx = txs.filter((x) => x.occurred_on.startsWith(String(year)));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const series = monthlySeries(yearTx, months);
  const sum = totals(yearTx);
  const fmt = (v: number) => formatAmount(v, company.currency);

  return <>
    <PageHeader title={t.nav.reports} action={<label className="flex items-center gap-2 text-sm text-muted-foreground">{t.year}<select className={selectClass} value={year} onChange={(e) => navigate({ search: { year: Number(e.target.value) } })}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>} />
    {yearTx.length === 0 ? <Panel><EmptyState text={t.noReport} icon={<BarChart3 />} /></Panel> : <>
      <h2 className="text-lg font-semibold text-navy">{t.yearlyReport} <span className="num">{year}</span></h2>
      <section className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.revenue} value={fmt(sum.revenue)} caption={String(year)} icon={<TrendingUp />} />
        <StatCard label={t.expenses} value={fmt(sum.expenses)} caption={String(year)} icon={<TrendingDown />} />
        <StatCard label={t.netProfit} value={fmt(sum.net)} caption={String(year)} tone={sum.net > 0 ? "positive" : sum.net < 0 ? "negative" : "neutral"} icon={<Wallet />} />
        <StatCard label={t.margin} value={sum.margin === null ? "—" : formatPercent(sum.margin).replace("+", "")} caption={String(year)} icon={<Percent />} />
      </section>
      <Panel title={t.monthly}><MonthlyChart data={series} currency={company.currency} /></Panel>
      <Panel title={t.monthlyReport}>
        <div className="-mx-4 overflow-x-auto sm:mx-0"><table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="px-4 py-2 text-start font-medium">{t.month}</th><th className="px-4 py-2 text-end font-medium">{t.revenue}</th><th className="px-4 py-2 text-end font-medium">{t.expenses}</th><th className="px-4 py-2 text-end font-medium">{t.netProfit}</th><th className="px-4 py-2 text-end font-medium">{t.margin}</th></tr></thead>
          <tbody className="divide-y divide-border">{series.map((m) => <tr key={m.month} className="hover:bg-background">
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
