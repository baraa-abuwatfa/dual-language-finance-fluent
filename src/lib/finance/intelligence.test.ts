import { describe, expect, it } from "vitest";
import { analyze, previousRange, rangeMonths } from "./intelligence";
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
});
