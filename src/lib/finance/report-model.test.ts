import { describe, expect, it } from "vitest";
import { buildReport, reportRange, comparisonSelection } from "./report-model";
import { analyze } from "./intelligence";
import type { Tx } from "./metrics";
const tx = (id: string, occurred_on: string, type: Tx["type"], amount: number): Tx => ({ id, occurred_on, type, amount, category: type === "income" ? "Product Sales" : "Rent", description: null });
const data = [tx("1", "2024-02-01", "income", 1000), tx("2", "2024-02-29", "expense", 250), tx("invoice-expense", "2024-02-15", "expense", 50), tx("4", "2024-01-31", "income", 500), tx("5", "2024-03-01", "income", 900), tx("6", "2023-12-31", "income", 400)];
describe("financial reporting rules", () => {
  it("limits monthly totals to the calendar month including leap day and invoice expense once", () => {
    const r = buildReport(data, { type: "monthly", year: 2024, month: 2 });
    expect(r.range).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    expect(r.totals).toEqual({ revenue: 1000, expenses: 300, net: 700, margin: 70 });
    expect(r.records.map((t) => t.id)).toEqual(["1", "invoice-expense", "2"]); expect(r.trends).toHaveLength(29);
  });
  it("compares the previous calendar month", () => {
    const r = buildReport(data, { type: "monthly", year: 2024, month: 2 });
    expect(r.previous).toEqual({ from: "2024-01-01", to: "2024-01-31" });
    expect(r.analysis.before.revenue).toBe(500); expect(r.analysis.revChange).toBe(100);
    expect(comparisonSelection({ type: "monthly", year: 2024, month: 1 })).toEqual({ type: "monthly", year: 2023, month: 12 });
  });
  it("includes twelve months, annual totals and previous calendar year", () => {
    const r = buildReport(data, { type: "annual", year: 2024, month: 2 });
    expect(r.annual).toHaveLength(12); expect(r.trends).toHaveLength(12);
    expect(r.totals).toEqual({ revenue: 2400, expenses: 300, net: 2100, margin: 87.5 });
    expect(r.previous).toEqual({ from: "2023-01-01", to: "2023-12-31" }); expect(r.analysis.before.revenue).toBe(400);
    expect(r.annual.reduce((s, m) => s + m.net, 0)).toBe(r.totals.net);
  });
  it("keeps missing data explicit", () => {
    const r = buildReport([], { type: "annual", year: 2026, month: 1 });
    expect(r.totals).toEqual({ revenue: 0, expenses: 0, net: 0, margin: null });
    expect(r.hasPrevious).toBe(false); expect(r.analysis.missing).toContain("noData"); expect(r.analysis.recs).toEqual([]);
  });
  it("preserves Financial Intelligence's default comparison", () => {
    expect(analyze(data, reportRange({ type: "monthly", year: 2024, month: 2 })).prevRange).toEqual({ from: "2024-01-03", to: "2024-01-31" });
  });
});