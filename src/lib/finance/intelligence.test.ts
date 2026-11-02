import { describe, expect, it } from "vitest";
import { analyze, assessHealth, previousRange, rangeMonths, recPriority, spendingRisks } from "./intelligence";
import type { Tx } from "./metrics";

const tx = (id: string, type: Tx["type"], amount: number, category: string, occurred_on: string): Tx => ({ id, type, amount, category, description: null, occurred_on });
const range = { from: "2026-10-01", to: "2026-10-31" };

describe("financial intelligence", () => {
  it("compares against the equal-length previous period", () => { expect(previousRange(range)).toEqual({ from: "2026-08-31", to: "2026-09-30" }); });
  it("lists months across the range", () => { expect(rangeMonths({ from: "2025-12-10", to: "2026-02-01" })).toEqual(["2025-12", "2026-01", "2026-02"]); });
  it("reports missing data instead of inventing figures", () => { expect(analyze([], range).missing).toEqual(["noData", "noPrevious"]); });
  it("flags an expense at least twice its category's historical average", () => {
    const hist = ["2026-07-05", "2026-08-05", "2026-09-05"].map((d, i) => tx(`h${i}`, "expense", 100, "Ads", d));
    const r = analyze([...hist, tx("x", "expense", 250, "Ads", "2026-10-05")], range);
    expect(r.unusual[0]).toMatchObject({ average: 100, samples: 3, ratio: 2.5 });
  });
  it("does not flag without three historical records", () => {
    expect(analyze([tx("h", "expense", 10, "Ads", "2026-09-05"), tx("x", "expense", 900, "Ads", "2026-10-05")], range).unusual).toEqual([]);
  });
  it("alerts when expenses grow 20% or more", () => {
    const r = analyze([tx("a", "expense", 100, "Rent", "2026-09-10"), tx("b", "expense", 120, "Rent", "2026-10-10")], range);
    expect(r.alerts).toContainEqual({ kind: "expenseGrowth", current: 120, previous: 100, change: 20 });
  });
  it("reports insufficient health data instead of inventing a status", () => {
    expect(assessHealth(analyze([], range))).toEqual({ status: "insufficient", score: 0, reasons: [] });
  });
  it("rates a profitable, stable period as healthy", () => {
    const r = analyze([tx("a", "income", 1000, "Sales", "2026-10-05"), tx("b", "expense", 400, "Rent", "2026-10-06")], range);
    const h = assessHealth(r);
    expect(h.status).toBe("healthy");
    expect(h.reasons).toContainEqual({ key: "profitable", amount: 600 });
  });
  it("rates a loss-making period with fast-growing expenses as critical", () => {
    const r = analyze([tx("p", "expense", 100, "Rent", "2026-09-10"), tx("a", "income", 100, "Sales", "2026-10-05"), tx("b", "expense", 500, "Rent", "2026-10-06")], range);
    const h = assessHealth(r);
    expect(h.status).toBe("critical");
    expect(h.reasons).toContainEqual({ key: "negativeNet", amount: -400 });
  });
  it("flags concentration risk only when several categories exist", () => {
    const single = analyze([tx("a", "expense", 100, "Rent", "2026-10-06")], range);
    expect(spendingRisks(single)).toEqual([]);
    const multi = analyze([tx("a", "expense", 300, "Rent", "2026-10-06"), tx("b", "expense", 100, "Ads", "2026-10-07")], range);
    expect(spendingRisks(multi)[0]).toMatchObject({ kind: "concentration", category: "Rent", share: 75 });
  });
  it("flags growth risk only with previous-period data", () => {
    const noPrev = analyze([tx("a", "expense", 100, "Rent", "2026-10-06"), tx("b", "expense", 100, "Ads", "2026-10-07")], range);
    expect(spendingRisks(noPrev).every((k) => k.kind === "concentration")).toBe(true);
    const grown = analyze([tx("a", "expense", 50, "Rent", "2026-09-06"), tx("b", "expense", 600, "Ads", "2026-09-07"), tx("c", "expense", 150, "Rent", "2026-10-06"), tx("d", "expense", 600, "Ads", "2026-10-07")], range);
    expect(spendingRisks(grown)).toContainEqual(expect.objectContaining({ kind: "growth", category: "Rent", change: 200 }));
  });
  it("ranks loss and revenue-drop recommendations as high priority", () => {
    expect(recPriority({ kind: "cutCosts", net: -1, expenses: 2 })).toBe("high");
    expect(recPriority({ kind: "revenueFollowUp", current: 1, previous: 2, change: -50 })).toBe("high");
    expect(recPriority({ kind: "concentration", category: "Rent", amount: 1, share: 50 })).toBe("medium");
  });
});
