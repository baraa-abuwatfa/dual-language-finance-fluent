import { describe, expect, it } from "vitest";
import { buildFinancialBrief } from "./context";
import type { Tx } from "@/lib/finance/metrics";

const tx = (id: string, type: Tx["type"], amount: number, category: string, occurred_on: string): Tx => ({ id, type, amount, category, description: null, occurred_on });
const opts = { company: "Acme", currency: "USD", locale: "en" as const, today: "2026-11-02" };

describe("assistant financial brief", () => {
  it("includes real totals, ranges and categories from the transactions", () => {
    const brief = buildFinancialBrief([
      tx("a", "income", 1000, "Sales", "2026-11-01"),
      tx("b", "expense", 500, "Rent", "2026-11-01"),
      tx("c", "expense", 200, "Ads", "2026-10-10"),
    ], opts);
    expect(brief).toContain("Acme");
    expect(brief).toContain("USD");
    expect(brief).toContain("2026-11-01 → 2026-11-02");
    expect(brief).toContain("Rent");
    expect(brief).toContain("100.0% of expenses");
    expect(brief).toContain("across 3 recorded transactions");
  });
  it("states insufficient data instead of a score when the range is empty", () => {
    const brief = buildFinancialBrief([], opts);
    expect(brief).toContain("Health score: insufficient data");
    expect(brief).toContain("across 0 recorded transactions");
  });
  it("marks the margin as n/a when there is no revenue", () => {
    const brief = buildFinancialBrief([tx("b", "expense", 500, "Rent", "2026-11-01")], opts);
    expect(brief).toContain("margin n/a (no revenue)");
  });
  it("declares the answer language from the locale", () => {
    expect(buildFinancialBrief([], { ...opts, locale: "ar" })).toContain("Answer language: Arabic");
  });
});
