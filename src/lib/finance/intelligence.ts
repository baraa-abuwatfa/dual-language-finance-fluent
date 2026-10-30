import { categoryBreakdown, totals, type Tx } from "./metrics";

/** Deterministic, rule-based analysis over a date range. No figures are estimated. */
export type Range = { from: string; to: string };

const DAY = 86_400_000;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/** Equal-length period immediately before the range. */
export function previousRange({ from, to }: Range): Range {
  const days = Math.round((toMs(to) - toMs(from)) / DAY) + 1;
  return { from: toIso(toMs(from) - days * DAY), to: toIso(toMs(from) - DAY) };
}

export const inRange = (txs: Tx[], r: Range) => txs.filter((t) => t.occurred_on >= r.from && t.occurred_on <= r.to);
export const change = (cur: number, prev: number) => (prev > 0 ? round(((cur - prev) / prev) * 100, 1) : null);

export type Unusual = { tx: Tx; average: number; samples: number; ratio: number };
export type Alert =
  | { kind: "negativeNet"; net: number }
  | { kind: "expenseGrowth"; current: number; previous: number; change: number }
  | { kind: "revenueDrop"; current: number; previous: number; change: number }
  | { kind: "unusual"; item: Unusual };
export type Rec =
  | { kind: "categoryGrowth"; category: string; current: number; previous: number; change: number }
  | { kind: "concentration"; category: string; amount: number; share: number }
  | { kind: "cutCosts"; net: number; expenses: number }
  | { kind: "revenueFollowUp"; current: number; previous: number; change: number }
  | { kind: "verifyUnusual"; item: Unusual };
export type Missing = "noData" | "noPrevious" | "noHistory" | "noRevenue";

export function analyze(txs: Tx[], range: Range) {
  const prevRange = previousRange(range);
  const cur = inRange(txs, range), prev = inRange(txs, prevRange);
  const now = totals(cur), before = totals(prev);
  const prevCats = new Map(categoryBreakdown(prev).map((c) => [c.category, c.amount]));
  const categories = categoryBreakdown(cur).map((c) => ({
    ...c, previous: prevCats.get(c.category) ?? 0,
    share: now.expenses > 0 ? round((c.amount / now.expenses) * 100, 1) : 0,
    change: change(c.amount, prevCats.get(c.category) ?? 0),
  }));

  // Unusual: an expense at least 2x its category's historical average (≥3 earlier records) and above mean + 2σ.
  const history = txs.filter((t) => t.type === "expense" && t.occurred_on < range.from);
  const unusual: Unusual[] = [];
  for (const t of cur) {
    if (t.type !== "expense") continue;
    const base = history.filter((h) => h.category === t.category).map((h) => h.amount);
    if (base.length < 3) continue;
    const avg = base.reduce((s, v) => s + v, 0) / base.length;
    const sd = Math.sqrt(base.reduce((s, v) => s + (v - avg) ** 2, 0) / base.length);
    if (avg > 0 && t.amount >= avg * 2 && t.amount > avg + 2 * sd) unusual.push({ tx: t, average: round(avg), samples: base.length, ratio: round(t.amount / avg, 1) });
  }
  unusual.sort((a, b) => b.ratio - a.ratio);

  const alerts: Alert[] = [], recs: Rec[] = [], missing: Missing[] = [];
  const expChange = change(now.expenses, before.expenses), revChange = change(now.revenue, before.revenue);
  if (cur.length === 0) missing.push("noData");
  if (prev.length === 0) missing.push("noPrevious");
  if (cur.some((t) => t.type === "expense") && history.length < 3) missing.push("noHistory");
  if (cur.length > 0 && now.revenue === 0) missing.push("noRevenue");

  if (cur.length > 0 && now.net < 0) { alerts.push({ kind: "negativeNet", net: now.net }); recs.push({ kind: "cutCosts", net: now.net, expenses: now.expenses }); }
  if (expChange !== null && expChange >= 20) alerts.push({ kind: "expenseGrowth", current: now.expenses, previous: before.expenses, change: expChange });
  if (revChange !== null && revChange <= -20) { alerts.push({ kind: "revenueDrop", current: now.revenue, previous: before.revenue, change: revChange }); recs.push({ kind: "revenueFollowUp", current: now.revenue, previous: before.revenue, change: revChange }); }
  for (const item of unusual.slice(0, 5)) { alerts.push({ kind: "unusual", item }); recs.push({ kind: "verifyUnusual", item }); }
  for (const c of categories) if (c.change !== null && c.change >= 30) recs.push({ kind: "categoryGrowth", category: c.category, current: c.amount, previous: c.previous, change: c.change });
  const top = categories[0];
  if (top && categories.length > 1 && top.share >= 40) recs.push({ kind: "concentration", category: top.category, amount: top.amount, share: top.share });

  return { range, prevRange, now, before, revChange, expChange, netChange: before.net !== 0 ? round(((now.net - before.net) / Math.abs(before.net)) * 100, 1) : null, categories, unusual, alerts, recs, missing, count: cur.length };
}

/** Month keys (YYYY-MM) covered by the range, capped to the last 24. */
export function rangeMonths({ from, to }: Range) {
  const out: string[] = [];
  let [y, m] = from.slice(0, 7).split("-").map(Number) as [number, number];
  const end = to.slice(0, 7);
  for (;;) { const k = `${y}-${String(m).padStart(2, "0")}`; out.push(k); if (k >= end) break; m++; if (m > 12) { m = 1; y++; } }
  return out.slice(-24);
}
