import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Lightbulb, LineChart, Sparkles } from "lucide-react";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel } from "@/components/app/ui";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { categoryLabel } from "@/lib/finance/categories";
import { insights, monthKey } from "@/lib/finance/metrics";
import { formatAmount, todayIso, transactionsQuery } from "@/lib/finance/queries";

export const Route = createFileRoute("/_authenticated/_company/insights")({
  head: () => authHead("AI Insights", "Evidence-based findings from your recorded transactions."),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery(context.company.id)),
  component: Insights,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Insights() {
  const { t, locale } = useAppCopy();
  const { company } = useCompany();
  const { data: txs } = useSuspenseQuery(transactionsQuery(company.id));
  const fmt = (v: number) => formatAmount(v, company.currency);
  const pct = (v: number) => `${v.toFixed(1)}%`;
  const found = insights(txs, monthKey(todayIso()));
  const alerts: string[] = [], recs: string[] = [], obs: string[] = [];
  for (const i of found) {
    if (i.kind === "categorySpike") { alerts.push(t.spike(categoryLabel(i.category, locale), pct(i.change))); recs.push(t.spikeRec(categoryLabel(i.category, locale))); }
    if (i.kind === "largeExpense") { alerts.push(`${t.large(fmt(i.tx.amount), fmt(i.average))} (${categoryLabel(i.tx.category, locale)}, ${i.tx.occurred_on})`); recs.push(t.largeRec); }
    if (i.kind === "negativeNet") { alerts.push(t.negative(fmt(Math.abs(i.net)))); recs.push(t.negativeRec); }
    if (i.kind === "margin") obs.push(t.marginObs(pct(i.margin)));
    if (i.kind === "topCategory") obs.push(t.topObs(categoryLabel(i.category, locale), pct(i.share)));
  }
  const list = (items: string[], tone: string) => <ul className="space-y-2">{[...new Set(items)].map((s) => <li key={s} className={`rounded-lg border-s-4 bg-background p-3 text-sm leading-6 ${tone}`}>{s}</li>)}</ul>;

  return <>
    <PageHeader title={t.nav.insights} description={t.insightsIntro} />
    {found.length === 0 ? <Panel><EmptyState text={t.insightsEmpty} icon={<Sparkles />} /></Panel> :
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t.alerts} action={<AlertTriangle className="size-4 text-negative" aria-hidden="true" />}>{alerts.length ? list(alerts, "border-negative") : <p className="text-sm text-muted-foreground">—</p>}</Panel>
        <Panel title={t.recommendations} action={<Lightbulb className="size-4 text-taupe" aria-hidden="true" />}>{recs.length ? list(recs, "border-champagne") : <p className="text-sm text-muted-foreground">—</p>}</Panel>
        <Panel title={t.observations} action={<LineChart className="size-4 text-steel" aria-hidden="true" />}>{obs.length ? list(obs, "border-steel") : <p className="text-sm text-muted-foreground">—</p>}</Panel>
      </div>}
  </>;
}
