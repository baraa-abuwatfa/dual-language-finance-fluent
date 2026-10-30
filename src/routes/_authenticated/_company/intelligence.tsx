import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Info, Lightbulb, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel, StatCard } from "@/components/app/ui";
import { MonthlyChart, CategoryChart } from "@/components/app/charts";
import { Button } from "@/components/ui/button";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { analyze, inRange, rangeMonths, type Range } from "@/lib/finance/intelligence";
import { intelCopy } from "@/lib/finance/intelligence-copy";
import { lastMonths, monthlySeries } from "@/lib/finance/metrics";
import { formatAmount, todayIso, transactionsQuery } from "@/lib/finance/queries";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
function preset(months: number): Range {
  const today = todayIso();
  return { from: `${lastMonths(today.slice(0, 7), months)[0]}-01`, to: today };
}

export const Route = createFileRoute("/_authenticated/_company/intelligence")({
  validateSearch: (s: Record<string, unknown>): Partial<Range> => ({
    from: typeof s.from === "string" && ISO.test(s.from) ? s.from : undefined,
    to: typeof s.to === "string" && ISO.test(s.to) ? s.to : undefined,
  }),
  head: () => authHead("Financial Intelligence", "Rule-based trends, comparisons, alerts and recommendations from your recorded transactions."),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery(context.company.id)),
  component: Intelligence,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Intelligence() {
  const { t: app, locale } = useAppCopy();
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
  const series = monthlySeries(inRange(txs, r.range), rangeMonths(r.range));
  const cmp = (v: number | null) => (v === null ? t.noCompare : t.vsPrev(pct(v)));

  const alertText = (a: (typeof r.alerts)[number]) =>
    a.kind === "negativeNet" ? t.a.negativeNet(fmt(Math.abs(a.net)))
    : a.kind === "unusual" ? t.a.unusual(fmt(a.item.tx.amount), a.item.tx.category, a.item.tx.occurred_on, String(a.item.ratio))
    : t.a[a.kind](fmt(a.current), fmt(a.previous), pct(a.change));
  const recText = (x: (typeof r.recs)[number]): [string, string] => {
    switch (x.kind) {
      case "categoryGrowth": return [t.r.categoryGrowth(x.category), t.r.categoryGrowthWhy(fmt(x.previous), fmt(x.current), pct(x.change))];
      case "concentration": return [t.r.concentration(x.category), t.r.concentrationWhy(fmt(x.amount), `${x.share.toFixed(1)}%`)];
      case "cutCosts": return [t.r.cutCosts, t.r.cutCostsWhy(fmt(x.net), fmt(x.expenses))];
      case "revenueFollowUp": return [t.r.revenueFollowUp, t.r.revenueFollowUpWhy(fmt(x.previous), fmt(x.current), pct(x.change))];
      case "verifyUnusual": return [t.r.verifyUnusual(x.item.tx.category), t.r.verifyUnusualWhy(fmt(x.item.tx.amount), fmt(x.item.average), String(x.item.samples))];
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
    </Panel>

    {r.missing.length > 0 && <Panel title={t.missingTitle}><ul className="space-y-2">{r.missing.map((m) => <li key={m} className="rounded-lg border-s-4 border-mist bg-background p-3 text-sm leading-6">{t.missing[m]}</li>)}</ul></Panel>}

    {r.count > 0 && <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={app.revenue} value={fmt(r.now.revenue)} caption={cmp(r.revChange)} icon={<TrendingUp />} />
        <StatCard label={app.expenses} value={fmt(r.now.expenses)} caption={cmp(r.expChange)} icon={<TrendingDown />} />
        <StatCard label={app.netProfit} value={fmt(r.now.net)} tone={r.now.net >= 0 ? "positive" : "negative"} caption={cmp(r.netChange)} icon={<Wallet />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.trends}><MonthlyChart data={series} currency={company.currency} />
          <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">{series.filter((m) => m.revenue || m.expenses).map((m) => <li key={m.month} className="flex justify-between gap-2"><span className="num">{m.month}</span><span className={`num ${m.net < 0 ? "text-negative" : "text-positive"}`}>{app.netProfit}: {fmt(m.net)}</span></li>)}</ul>
        </Panel>
        <Panel title={t.comparison}>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-start text-xs text-muted-foreground"><th className="py-2 text-start font-medium">{t.metric}</th><th className="py-2 text-end font-medium">{t.current}</th><th className="py-2 text-end font-medium">{t.previous}</th><th className="py-2 text-end font-medium">{t.change}</th></tr></thead>
            <tbody>{([[app.revenue, r.now.revenue, r.before.revenue, r.revChange], [app.expenses, r.now.expenses, r.before.expenses, r.expChange], [app.netProfit, r.now.net, r.before.net, r.netChange]] as const).map(([l, c, p, ch]) => <tr key={l} className="border-b border-border/60"><td className="py-2.5 font-medium text-navy">{l}</td><td className="num py-2.5 text-end">{fmt(c)}</td><td className="num py-2.5 text-end text-muted-foreground">{fmt(p)}</td><td className="num py-2.5 text-end">{pct(ch)}</td></tr>)}</tbody></table></div>
          <p className="mt-2 text-xs text-muted-foreground num">{r.prevRange.from} → {r.prevRange.to}</p>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.categories}>{r.categories.length ? <>
          <CategoryChart data={r.categories} currency={company.currency} />
          <ul className="mt-4 space-y-1.5 text-sm">{r.categories.map((c) => <li key={c.category} className="flex justify-between gap-3 border-b border-border/60 pb-1.5"><span className="truncate">{c.category}</span><span className="num shrink-0 text-muted-foreground">{fmt(c.amount)} · {pct(c.change)}</span></li>)}</ul>
        </> : <EmptyState text={app.categoryEmpty} />}</Panel>
        <Panel title={t.unusual}>{r.unusual.length ? <ul className="space-y-2">{r.unusual.map((u) => <li key={u.tx.id} className="rounded-lg border-s-4 border-negative bg-background p-3 text-sm leading-6">{t.a.unusual(fmt(u.tx.amount), u.tx.category, u.tx.occurred_on, String(u.ratio))}<span className="block text-xs text-muted-foreground">{t.r.verifyUnusualWhy(fmt(u.tx.amount), fmt(u.average), String(u.samples))}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{t.unusualNone}</p>}</Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.alerts} action={<AlertTriangle className="size-4 text-negative" aria-hidden="true" />}>{r.alerts.length ? <ul className="space-y-2">{r.alerts.map((a, i) => <li key={i} className="rounded-lg border-s-4 border-negative bg-background p-3 text-sm leading-6">{alertText(a)}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t.alertsNone}</p>}</Panel>
        <Panel title={t.recs} action={<Lightbulb className="size-4 text-taupe" aria-hidden="true" />}>{r.recs.length ? <ul className="space-y-2">{r.recs.map((x, i) => { const [what, why] = recText(x); return <li key={i} className="rounded-lg border-s-4 border-champagne bg-background p-3 text-sm leading-6"><p className="font-medium text-navy">{what}</p><p className="text-xs text-muted-foreground"><span className="font-semibold">{t.why}:</span> {why}</p></li>; })}</ul> : <p className="text-sm text-muted-foreground">{t.recsNone}</p>}</Panel>
      </div>
    </>}
  </>;
}
