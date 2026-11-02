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

export function analyze(txs: Tx[], range: Range, comparisonRange?: Range) {
  const prevRange = comparisonRange ?? previousRange(range);
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
  // Net profit margin: net / revenue. Null when revenue is zero — never divide by zero or invent a figure.
  const margin = now.revenue > 0 ? round((now.net / now.revenue) * 100, 1) : null;
  if (cur.length === 0) missing.push("noData");
  if (prev.length === 0) missing.push("noPrevious");
  if (cur.some((t) => t.type === "expense") && history.length < 3) missing.push("noHistory");
  if (cur.length > 0 && now.revenue === 0) missing.push("noRevenue");

  // Expense growth is only a warning when it outpaces revenue growth (or revenue can't be compared).
  const expOutpacing = expChange !== null && expChange >= 20 && (revChange === null || expChange > revChange);
  if (cur.length > 0 && now.net < 0) { alerts.push({ kind: "negativeNet", net: now.net }); recs.push({ kind: "cutCosts", net: now.net, expenses: now.expenses }); }
  if (expOutpacing) alerts.push({ kind: "expenseGrowth", current: now.expenses, previous: before.expenses, change: expChange });
  if (revChange !== null && revChange <= -20) { alerts.push({ kind: "revenueDrop", current: now.revenue, previous: before.revenue, change: revChange }); recs.push({ kind: "revenueFollowUp", current: now.revenue, previous: before.revenue, change: revChange }); }
  for (const item of unusual.slice(0, 5)) { alerts.push({ kind: "unusual", item }); recs.push({ kind: "verifyUnusual", item }); }
  const top = categories[0];
  const concentrated = top !== undefined && categories.length > 1 && top.share >= 40;
  for (const c of categories) {
    if (c.change === null || c.change < 30) continue;
    if (concentrated && c.category === top.category) continue; // already covered by the concentration recommendation
    recs.push({ kind: "categoryGrowth", category: c.category, current: c.amount, previous: c.previous, change: c.change });
  }
  if (concentrated) recs.push({ kind: "concentration", category: top.category, amount: top.amount, share: top.share });

  return { range, prevRange, now, before, revChange, expChange, margin, netChange: before.net !== 0 ? round(((now.net - before.net) / Math.abs(before.net)) * 100, 1) : null, categories, unusual, alerts, recs, missing, count: cur.length };
}

export type Analysis = ReturnType<typeof analyze>;

export type HealthStatus = "healthy" | "attention" | "critical" | "insufficient";
export type HealthReason =
  | { key: "negativeNet"; amount: number }
  | { key: "expenseGrowth"; pct: number }
  | { key: "revenueDrop"; pct: number }
  | { key: "unusual"; count: number }
  | { key: "concentration"; category: string; share: number }
  | { key: "profitable"; amount: number }
  | { key: "revenueGrowing"; pct: number }
  | { key: "spendingStable" };
export type Health = { status: HealthStatus; score: number; reasons: HealthReason[] };

/**
 * Overall financial condition from the same deterministic analysis.
 * Documented weights: start at 100; net loss −45; expenses growing 20%+
 * faster than revenue −20; revenue drop of 20%+ −20; each statistically
 * unusual expense −5 (max −10); one category above 40% of expenses −10.
 * Healthy ≥ 75, Needs Attention ≥ 40, below that Critical.
 * Missing data never deducts points: an empty range is "insufficient",
 * and metrics that can't be computed (no previous period, thin history)
 * are simply not scored.
 */
export function assessHealth(a: Analysis): Health {
  if (a.missing.includes("noData")) return { status: "insufficient", score: 0, reasons: [] };
  let score = 100;
  const reasons: HealthReason[] = [];
  if (a.now.net < 0) { score -= 45; reasons.push({ key: "negativeNet", amount: a.now.net }); }
  if (a.expChange !== null && a.expChange >= 20 && (a.revChange === null || a.expChange > a.revChange)) { score -= 20; reasons.push({ key: "expenseGrowth", pct: a.expChange }); }
  if (a.revChange !== null && a.revChange <= -20) { score -= 20; reasons.push({ key: "revenueDrop", pct: a.revChange }); }
  if (a.unusual.length > 0) { score -= 5 * Math.min(2, a.unusual.length); reasons.push({ key: "unusual", count: a.unusual.length }); }
  const top = a.categories[0];
  if (top && a.categories.length > 1 && top.share >= 40) { score -= 10; reasons.push({ key: "concentration", category: top.category, share: top.share }); }
  if (a.now.net > 0) reasons.push({ key: "profitable", amount: a.now.net });
  if (a.revChange !== null && a.revChange > 0) reasons.push({ key: "revenueGrowing", pct: a.revChange });
  if (a.unusual.length === 0 && !a.missing.includes("noHistory")) reasons.push({ key: "spendingStable" });
  return { status: score >= 75 ? "healthy" : score >= 40 ? "attention" : "critical", score: Math.max(0, score), reasons };
}

export type Risk = { kind: "concentration" | "growth"; category: string; amount: number; share: number; change: number | null; previous: number };

/**
 * Categories that carry spending risk: at least a quarter of all expenses,
 * or growing 30%+ versus the previous period. A single category is never
 * flagged for concentration (100% share is trivial), and growth requires
 * previous-period data, so thin history produces no false alerts.
 */
export function spendingRisks(a: Analysis): Risk[] {
  if (a.count === 0 || a.now.expenses <= 0) return [];
  return a.categories
    .filter((c) => (a.categories.length > 1 && c.share >= 25) || (c.change !== null && c.change >= 30))
    .map((c) => ({ kind: a.categories.length > 1 && c.share >= 25 ? "concentration" as const : "growth" as const, category: c.category, amount: c.amount, share: c.share, change: c.change, previous: c.previous }))
    .sort((x, y) => y.share - x.share)
    .slice(0, 5);
}

/** Priority of a recommendation, derived from the severity of its trigger. */
export function recPriority(rec: Rec): "high" | "medium" {
  return rec.kind === "cutCosts" || rec.kind === "revenueFollowUp" ? "high" : "medium";
}

/** Month keys (YYYY-MM) covered by the range, capped to the last 24. */
export function rangeMonths({ from, to }: Range) {
  const out: string[] = [];
  let [y, m] = from.slice(0, 7).split("-").map(Number) as [number, number];
  const end = to.slice(0, 7);
  for (;;) { const k = `${y}-${String(m).padStart(2, "0")}`; out.push(k); if (k >= end) break; m++; if (m > 12) { m = 1; y++; } }
  return out.slice(-24);
}
