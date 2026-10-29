import { describe, expect, it } from "vitest";
import { categoryBreakdown, insights, lastMonths, monthlySeries, totals, type Tx } from "./metrics";
import { resolveCompany } from "@/lib/company/selection";

const tx = (id: string, type: Tx["type"], amount: number, category: string, occurred_on: string): Tx => ({ id, type, amount, category, description: null, occurred_on });

describe("financial metrics", () => {
  it("net profit is revenue minus expenses", () => {
    expect(totals([tx("1", "income", 1000.1, "Sales", "2026-10-01"), tx("2", "expense", 400.05, "Rent", "2026-10-02")])).toEqual({ revenue: 1000.1, expenses: 400.05, net: 600.05, margin: 60 });
  });
  it("margin is null without revenue", () => { expect(totals([]).margin).toBeNull(); });
  it("lists months across year boundaries", () => { expect(lastMonths("2026-02", 3)).toEqual(["2025-12", "2026-01", "2026-02"]); });
  it("groups by month", () => { expect(monthlySeries([tx("1", "income", 50, "S", "2026-09-30")], ["2026-09", "2026-10"]).map((m) => m.revenue)).toEqual([50, 0]); });
  it("sorts expense categories by amount", () => {
    expect(categoryBreakdown([tx("1", "expense", 10, "A", "2026-10-01"), tx("2", "expense", 30, "B", "2026-10-01"), tx("3", "expense", 5, "A", "2026-10-01")])).toEqual([{ category: "B", amount: 30 }, { category: "A", amount: 15 }]);
  });
  it("flags a category that grew 30% or more month over month", () => {
    const r = insights([tx("1", "expense", 100, "Ads", "2026-09-10"), tx("2", "expense", 130, "Ads", "2026-10-10")], "2026-10");
    expect(r.find((i) => i.kind === "categorySpike")).toMatchObject({ category: "Ads", change: 30 });
  });
  it("produces no findings without data", () => { expect(insights([], "2026-10")).toEqual([]); });
});

describe("company selection", () => {
  const a = { id: "a" }, b = { id: "b" };
  it("sends users without companies to setup", () => { expect(resolveCompany([], null)).toBe("setup"); });
  it("uses the only company", () => { expect(resolveCompany([a], null)).toBe(a); });
  it("requires a choice with several companies", () => { expect(resolveCompany([a, b], null)).toBe("select"); });
  it("keeps a valid stored choice", () => { expect(resolveCompany([a, b], "b")).toBe(b); });
});
