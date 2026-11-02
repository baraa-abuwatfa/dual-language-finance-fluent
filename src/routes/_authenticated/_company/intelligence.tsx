import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, AlertTriangle, ArrowRight, HeartPulse, Info, Lightbulb, ShieldAlert, Sparkles } from "lucide-react";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { categoryLabel } from "@/lib/finance/categories";
import { analyze, assessHealth, recPriority, spendingRisks, type Range, type Rec } from "@/lib/finance/intelligence";
import { intelCopy } from "@/lib/finance/intelligence-copy";
import { lastMonths } from "@/lib/finance/metrics";
import { formatAmount, todayIso, transactionsQuery } from "@/lib/finance/queries";
import { cn } from "@/lib/utils";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
function preset(months: number): Range {
  const today = todayIso();
  return { from: `${lastMonths(today.slice(0, 7), months)[0]}-01`, to: today };
}

export const Route = createFileRoute("/_authenticated/_company/intelligence")({
  validateSearch: (s: Record<string, unknown>): { from?: string | undefined; to?: string | undefined } => {
    const from = s["from"], to = s["to"];
    return { from: typeof from === "string" && ISO.test(from) ? from : undefined, to: typeof to === "string" && ISO.test(to) ? to : undefined };
  },
  head: () => authHead("Financial Intelligence", "Rule-based decision support: financial health, risks and recommendations from your recorded transactions."),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery(context.company.id)),
  component: Intelligence,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

const healthTone = { healthy: "border-positive text-positive", attention: "border-taupe text-taupe", critical: "border-negative text-negative", insufficient: "border-mist text-muted-foreground" } as const;

function Intelligence() {
  const { locale } = useAppCopy();
  const t = intelCopy[locale];
  const { company } = useCompany();
  const { data: txs } = useSuspenseQuery(transactionsQuery(company.id));
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const def = preset(3);
  const range: Range = { from: search.from ?? def.from, to: search.to ?? def.to };
  const [draft, setDraft] = useState(range);
  const invalid = draft.from > draft.to;
  const go = (r: Range) => { setDraft(r); void navigate({ search: r }); };

  const fmt = (v: number) => formatAmount(v, company.currency);
  const pct = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
  const r = analyze(txs, range.from <= range.to ? range : def);
  const health = assessHealth(r);
  const risks = spendingRisks(r);
  const cat = (c: string) => categoryLabel(c, locale);

  const insights: string[] = [];
  if (r.revChange !== null && r.revChange > 0) insights.push(t.insights.revenueUp(pct(r.revChange), fmt(r.before.revenue), fmt(r.now.revenue)));
  if (r.revChange !== null && r.revChange < 0) insights.push(t.insights.revenueDown(pct(r.revChange), fmt(r.before.revenue), fmt(r.now.revenue)));
  if (r.expChange !== null && r.expChange > 0) insights.push(r.revChange !== null && r.revChange > r.expChange ? t.insights.expensesUpCovered(pct(r.expChange), fmt(r.before.expenses), fmt(r.now.expenses), pct(r.revChange)) : t.insights.expensesUp(pct(r.expChange), fmt(r.before.expenses), fmt(r.now.expenses)));
  if (r.expChange !== null && r.expChange < 0) insights.push(t.insights.expensesDown(pct(r.expChange), fmt(r.before.expenses), fmt(r.now.expenses)));
  if (r.count > 0) insights.push(r.now.net >= 0 ? t.insights.netPositive(fmt(r.now.net)) : t.insights.netNegative(fmt(Math.abs(r.now.net))));
  if (r.margin !== null) insights.push(t.insights.margin(`${r.margin.toFixed(1)}%`));

  const reasonText = (x: (typeof health.reasons)[number]) =>
    x.key === "negativeNet" ? t.health.reasons.negativeNet(fmt(Math.abs(x.amount)))
    : x.key === "expenseGrowth" ? t.health.reasons.expenseGrowth(pct(x.pct))
    : x.key === "revenueDrop" ? t.health.reasons.revenueDrop(pct(x.pct))
    : x.key === "unusual" ? t.health.reasons.unusual(String(x.count))
    : x.key === "concentration" ? t.health.reasons.concentration(cat(x.category), `${x.share.toFixed(1)}%`)
    : x.key === "profitable" ? t.health.reasons.profitable(fmt(x.amount))
    : x.key === "revenueGrowing" ? t.health.reasons.revenueGrowing(pct(x.pct))
    : t.health.reasons.spendingStable;

  const recText = (x: Rec): [string, string, string] => {
    switch (x.kind) {
      case "categoryGrowth": return [t.recs.categoryGrowth(cat(x.category)), t.recs.categoryGrowthWhy(fmt(x.previous), fmt(x.current), pct(x.change)), t.recs.categoryGrowthAction(cat(x.category))];
      case "concentration": return [t.recs.concentration(cat(x.category)), t.recs.concentrationWhy(fmt(x.amount), `${x.share.toFixed(1)}%`), t.recs.concentrationAction(cat(x.category))];
      case "cutCosts": return [t.recs.cutCosts, t.recs.cutCostsWhy(fmt(x.net), fmt(x.expenses)), t.recs.cutCostsAction];
      case "revenueFollowUp": return [t.recs.revenueFollowUp, t.recs.revenueFollowUpWhy(fmt(x.previous), fmt(x.current), pct(x.change)), t.recs.revenueFollowUpAction];
      case "verifyUnusual": return [t.recs.verifyUnusual(cat(x.item.tx.category)), t.recs.verifyUnusualWhy(fmt(x.item.tx.amount), fmt(x.item.average), String(x.item.samples)), t.recs.verifyUnusualAction(cat(x.item.tx.category))];
    }
  };
  const input = "h-10 rounded-md border border-input bg-card px-3 text-sm num focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

  return <>
    <PageHeader title={t.title} description={t.intro} />
    <Panel>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (!invalid) go(draft); }}>
        <label className="grid gap-1 text-sm font-medium text-navy">{t.from}<input type="date" className={input} value={draft.from} max={draft.to} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium text-navy">{t.to}<input type="date" className={input} value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label>
        <Button type="submit" disabled={invalid || !draft.from || !draft.to}>{t.apply}</Button>
        <div className="flex flex-wrap gap-2">{([["m1", 1], ["m3", 3], ["m6", 6], ["y1", 12]] as const).map(([k, n]) => <Button key={k} type="button" variant="subtle" size="sm" onClick={() => go(preset(n))}>{t.presets[k]}</Button>)}</div>
      </form>
      {invalid && <p role="alert" className="mt-2 text-sm text-negative">{t.invalidRange}</p>}
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{t.method} · <span className="num">{r.range.from} → {r.range.to}</span> · {t.records(String(r.count))}</p>
      <p className="mt-2 text-xs text-muted-foreground"><Link to="/reports" className="inline-flex items-center gap-1 font-medium text-steel underline-offset-4 hover:underline">{t.reportsLink}<ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" /></Link></p>
    </Panel>

    {r.missing.length > 0 && <Panel title={t.missingTitle}><ul className="space-y-2">{r.missing.map((m) => <li key={m} className="rounded-lg border-s-4 border-mist bg-background p-3 text-sm leading-6">{t.missing[m]}</li>)}</ul></Panel>}

    {/* A. Financial Health Overview */}
    <Panel title={t.health.title} action={<HeartPulse className="size-4 text-steel" aria-hidden="true" />}>
      {health.status === "insufficient" ? <EmptyState text={t.health.insufficient} /> : <>
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("rounded-full border-2 px-4 py-1.5 text-sm font-bold", healthTone[health.status])}>{t.health.status[health.status]}</span>
          <span className="num text-sm text-muted-foreground">{t.health.score(String(health.score))}</span>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.health.evidence}</p>
        <ul className="mt-2 space-y-2">{health.reasons.map((x, i) => <li key={i} className="rounded-lg border-s-4 border-steel bg-background p-3 text-sm leading-6">{reasonText(x)}</li>)}</ul>
        <p className="mt-3 text-xs text-muted-foreground">{t.health.criteria}</p>
      </>}
    </Panel>

    {r.count > 0 && <>
      {/* B. Key Financial Insights */}
      <Panel title={t.insights.title} action={<Activity className="size-4 text-steel" aria-hidden="true" />}>
        {insights.length ? <ul className="space-y-2">{insights.map((s, i) => <li key={i} className="rounded-lg border-s-4 border-champagne bg-background p-3 text-sm leading-6">{s}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t.insights.none}</p>}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* C. Unusual Expense Detection */}
        <Panel title={t.unusual.title} action={<AlertTriangle className="size-4 text-negative" aria-hidden="true" />}>
          {r.missing.includes("noHistory") ? <p className="text-sm text-muted-foreground">{t.unusual.insufficient}</p> : <>
            <p className="mb-3 text-xs text-muted-foreground">{t.unusual.thin}</p>
            {r.unusual.length ? <ul className="space-y-2">{r.unusual.map((u) => <li key={u.tx.id} className="rounded-lg border-s-4 border-negative bg-background p-3 text-sm leading-6">{t.unusual.item(fmt(u.tx.amount), cat(u.tx.category), u.tx.occurred_on, String(u.ratio))}<span className="block text-xs text-muted-foreground">{t.unusual.why(fmt(u.tx.amount), fmt(u.average), String(u.samples))}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{t.unusual.none}</p>}
          </>}
        </Panel>

        {/* D. Spending Risks */}
        <Panel title={t.risks.title} action={<ShieldAlert className="size-4 text-taupe" aria-hidden="true" />}>
          {risks.length ? <ul className="space-y-2">{risks.map((k) => <li key={k.category} className="rounded-lg border-s-4 border-taupe bg-background p-3 text-sm leading-6">
            {k.kind === "concentration" ? t.risks.concentration(cat(k.category), fmt(k.amount), `${k.share.toFixed(1)}%`) : t.risks.growth(cat(k.category), fmt(k.previous), fmt(k.amount), pct(k.change))}
            <span className="block text-xs text-muted-foreground">{k.kind === "concentration" ? t.risks.concentrationImpact : t.risks.growthImpact}</span>
          </li>)}</ul> : <p className="text-sm text-muted-foreground">{t.risks.none}</p>}
        </Panel>
      </div>

      {/* E. Decision Support & Recommendations */}
      <Panel title={t.recs.title} action={<Lightbulb className="size-4 text-taupe" aria-hidden="true" />}>
        {r.recs.length ? <ul className="space-y-2">{r.recs.map((x, i) => { const [issue, evidence, action] = recText(x); const p = recPriority(x); return <li key={i} className="rounded-lg border-s-4 border-champagne bg-background p-3 text-sm leading-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-navy"><span className="font-semibold">{t.recs.issue}:</span> {issue}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", p === "high" ? "bg-negative/10 text-negative" : "bg-champagne-soft text-taupe")}>{t.recs.priority[p]}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t.recs.priorityWhy[p]}</p>
          <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold">{t.recs.evidence}:</span> {evidence}</p>
          <p className="mt-1 text-xs text-navy"><span className="font-semibold">{t.recs.action}:</span> {action}</p>
        </li>; })}</ul> : <p className="text-sm text-muted-foreground">{t.recs.none}</p>}
      </Panel>
    </>}

    {r.count === 0 && <Panel><EmptyState text={t.missing.noData} icon={<Sparkles />} /></Panel>}
  </>;
}
