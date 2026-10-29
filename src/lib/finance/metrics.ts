export type Tx = { id: string; type: "income" | "expense"; amount: number; category: string; description: string | null; occurred_on: string };

export function monthKey(date: string) { return date.slice(0, 7); }

export function totals(txs: Tx[]) {
  let revenue = 0, expenses = 0;
  for (const t of txs) { if (t.type === "income") revenue += t.amount; else expenses += t.amount; }
  revenue = round(revenue); expenses = round(expenses);
  return { revenue, expenses, net: round(revenue - expenses), margin: revenue > 0 ? round(((revenue - expenses) / revenue) * 100, 1) : null };
}

/** Last `count` calendar months ending at `end` (YYYY-MM), oldest first. */
export function lastMonths(end: string, count: number) {
  const [y, m] = end.split("-").map(Number) as [number, number];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

export function monthlySeries(txs: Tx[], months: string[]) {
  return months.map((month) => ({ month, ...totals(txs.filter((t) => monthKey(t.occurred_on) === month)) }));
}

export function categoryBreakdown(txs: Tx[], type: "income" | "expense" = "expense") {
  const map = new Map<string, number>();
  for (const t of txs) if (t.type === type) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return [...map].map(([category, amount]) => ({ category, amount: round(amount) })).sort((a, b) => b.amount - a.amount);
}

export type Insight =
  | { kind: "categorySpike"; category: string; previous: number; current: number; change: number }
  | { kind: "largeExpense"; tx: Tx; average: number }
  | { kind: "negativeNet"; net: number }
  | { kind: "margin"; margin: number }
  | { kind: "topCategory"; category: string; share: number };

/** Deterministic, rule-based findings computed only from recorded transactions. */
export function insights(txs: Tx[], currentMonth: string): Insight[] {
  const out: Insight[] = [];
  const [prevMonth] = lastMonths(currentMonth, 2);
  const cur = txs.filter((t) => monthKey(t.occurred_on) === currentMonth);
  const prev = txs.filter((t) => monthKey(t.occurred_on) === prevMonth);
  const prevCats = new Map(categoryBreakdown(prev).map((c) => [c.category, c.amount]));
  for (const c of categoryBreakdown(cur)) {
    const p = prevCats.get(c.category);
    if (p && p > 0 && c.amount >= p * 1.3) out.push({ kind: "categorySpike", category: c.category, previous: p, current: c.amount, change: round(((c.amount - p) / p) * 100, 1) });
  }
  const expenses = txs.filter((t) => t.type === "expense");
  if (expenses.length >= 5) {
    const avg = expenses.reduce((s, t) => s + t.amount, 0) / expenses.length;
    const sd = Math.sqrt(expenses.reduce((s, t) => s + (t.amount - avg) ** 2, 0) / expenses.length);
    for (const t of expenses) if (sd > 0 && t.amount > avg + 2 * sd) out.push({ kind: "largeExpense", tx: t, average: round(avg) });
  }
  const month = totals(cur);
  if (cur.length > 0 && month.net < 0) out.push({ kind: "negativeNet", net: month.net });
  if (month.margin !== null) out.push({ kind: "margin", margin: month.margin });
  const cats = categoryBreakdown(cur);
  if (cats[0] && month.expenses > 0) out.push({ kind: "topCategory", category: cats[0].category, share: round((cats[0].amount / month.expenses) * 100, 1) });
  return out;
}

function round(v: number, digits = 2) { const f = 10 ** digits; return Math.round(v * f) / f; }
