import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyze, inRange, type Range } from "./intelligence";
import { categoryBreakdown, monthlySeries, totals, type Tx } from "./metrics";

export type ReportSelection = { type: "monthly" | "annual"; year: number; month: number };
export function reportRange(s: ReportSelection): Range {
  return s.type === "annual" ? { from: `${s.year}-01-01`, to: `${s.year}-12-31` }
    : { from: `${s.year}-${String(s.month).padStart(2, "0")}-01`, to: new Date(Date.UTC(s.year, s.month, 0)).toISOString().slice(0, 10) };
}
export function comparisonSelection(s: ReportSelection): ReportSelection {
  if (s.type === "annual") return { ...s, year: s.year - 1 };
  return s.month === 1 ? { ...s, year: s.year - 1, month: 12 } : { ...s, month: s.month - 1 };
}
export function buildReport(txs: Tx[], selection: ReportSelection) {
  const range = reportRange(selection), previous = reportRange(comparisonSelection(selection));
  const records = inRange(txs, range).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on) || a.id.localeCompare(b.id));
  const analysis = analyze(txs, range, previous);
  const months = Array.from({ length: 12 }, (_, i) => `${selection.year}-${String(i + 1).padStart(2, "0")}`);
  const annual = monthlySeries(inRange(txs, reportRange({ ...selection, type: "annual" })), months);
  const trends = selection.type === "annual" ? annual.map((m) => ({ key: m.month, ...totals(records.filter((t) => t.occurred_on.startsWith(m.month))) }))
    : Array.from({ length: Number(range.to.slice(-2)) }, (_, i) => {
      const key = `${range.from.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`;
      return { key, ...totals(records.filter((t) => t.occurred_on === key)) };
    });
  return { selection, range, previous, records, analysis, totals: totals(records), annual, trends,
    income: categoryBreakdown(records, "income"), expenses: categoryBreakdown(records),
    hasPrevious: inRange(txs, previous).length > 0,
    best: trends.filter((t) => t.revenue > 0).sort((a, b) => b.revenue - a.revenue)[0] };
}
export type FinancialReport = ReturnType<typeof buildReport>;

/** Report-only pagination: the shared dashboard query intentionally has a row cap. */
export const reportTransactionsQuery = (companyId: string) => queryOptions({
  queryKey: ["transactions", companyId, "complete-report"],
  queryFn: async (): Promise<Tx[]> => {
    const rows: Tx[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("transactions")
        .select("id, type, amount, category, description, occurred_on")
        .eq("company_id", companyId).order("occurred_on").order("id").range(offset, offset + 999);
      if (error) throw error;
      rows.push(...data.map((t) => ({ ...t, amount: Number(t.amount) })));
      if (data.length < 1000) return rows;
    }
  },
});