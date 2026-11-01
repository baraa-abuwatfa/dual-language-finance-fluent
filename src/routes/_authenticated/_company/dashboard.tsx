import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3, FileUp, Landmark, Minus, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { CategoryChart, MonthlyChart } from "@/components/app/charts";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel, StatCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { categoryBreakdown, lastMonths, monthKey, monthlySeries, totals } from "@/lib/finance/metrics";
import { formatAmount, transactionsQuery } from "@/lib/finance/queries";
import { inRange } from "@/lib/finance/intelligence";
import { categoryLabel } from "@/lib/finance/categories";

export const Route = createFileRoute("/_authenticated/_company/dashboard")({
  head: () => authHead("Dashboard", "Your AI CFO financial overview."),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery(context.company.id)),
  component: Dashboard,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Dashboard() {
  const { t, locale } = useAppCopy();
  const { company } = useCompany();
  const { data: txs } = useSuspenseQuery(transactionsQuery(company.id));
  // Current calendar month in the user's local time (same from/to range rule as Financial Intelligence).
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const cur = totals(inRange(txs, { from: `${month}-01`, to: `${month}-31` }));
  const fmt = (v: number) => formatAmount(v, company.currency);
  const has = txs.length > 0;
  const cap = has ? t.thisMonth : t.noData;
  const tone = (v: number): "neutral" | "positive" | "negative" => (!has || v === 0 ? "neutral" : v > 0 ? "positive" : "negative");
  const series = monthlySeries(txs, lastMonths(month, 6));
  const cats = categoryBreakdown(txs.filter((x) => monthKey(x.occurred_on) >= series[0]!.month));

  return <>
    <PageHeader title={t.overview} description={`${company.name} · ${company.currency}`} />
    <section className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t.revenue} value={has ? fmt(cur.revenue) : "—"} caption={cap} icon={<TrendingUp />} />
      <StatCard label={t.expenses} value={has ? fmt(cur.expenses) : "—"} caption={cap} icon={<TrendingDown />} />
      <StatCard label={t.netProfit} value={has ? fmt(cur.net) : "—"} caption={cap} tone={tone(cur.net)} icon={<Wallet />} />
      <StatCard label={t.cashFlow} value={has ? fmt(cur.net) : "—"} caption={cap} tone={tone(cur.net)} icon={<Landmark />} />
    </section>
    <Panel title={t.quick}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Button asChild variant="subtle" className="h-11 justify-start"><Link to="/transactions" search={{ new: "income" }}><Plus />{t.addIncome}</Link></Button>
        <Button asChild variant="subtle" className="h-11 justify-start"><Link to="/transactions" search={{ new: "expense" }}><Minus />{t.addExpense}</Link></Button>
        <Button asChild variant="subtle" className="h-11 justify-start"><Link to="/invoices"><FileUp />{t.uploadInvoice}</Link></Button>
        <Button asChild variant="subtle" className="h-11 justify-start"><Link to="/reports"><BarChart3 />{t.viewReports}</Link></Button>
      </div>
    </Panel>
    <div className="grid gap-4 xl:grid-cols-5">
      <Panel title={t.monthly} className="xl:col-span-3">{has ? <MonthlyChart data={series} currency={company.currency} /> : <EmptyState text={t.chartEmpty} icon={<BarChart3 />} />}</Panel>
      <Panel title={t.byCategory} className="xl:col-span-2">{cats.length ? <CategoryChart data={cats} currency={company.currency} /> : <EmptyState text={t.categoryEmpty} />}</Panel>
    </div>
    <Panel title={t.recent} action={has && <Link to="/transactions" className="text-sm font-semibold text-steel hover:underline">{t.viewAll}</Link>}>
      {has ? <ul className="divide-y divide-border">
        {txs.slice(0, 6).map((x) => <li key={x.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="truncate text-sm font-medium text-navy">{x.description || categoryLabel(x.category, locale)}</p><p className="text-xs text-muted-foreground">{categoryLabel(x.category, locale)} · <span className="num">{x.occurred_on}</span></p></div>
          <span className={`num shrink-0 text-sm font-semibold ${x.type === "income" ? "text-positive" : "text-negative"}`}>{x.type === "income" ? "+" : "−"}{fmt(x.amount)}</span>
        </li>)}
      </ul> : <EmptyState text={t.recentEmpty} action={<Button asChild size="sm" className="bg-steel text-on-navy hover:bg-steel/90"><Link to="/transactions" search={{ new: "income" }}><Plus />{t.addIncome}</Link></Button>} />}
    </Panel>
  </>;
}
