import { describe, expect, it } from "vitest";
import { categoriesFor, categoryLabel, isStandardCategory, validTransactionCategory } from "./categories";
import { analyze } from "./intelligence";
import { categoryBreakdown, totals, type Tx } from "./metrics";

describe("Standard financial category rules", () => {
  it("offers exactly the requested income categories", () => {
    expect(categoriesFor("income").map((c) => c.id)).toEqual(["Product Sales", "Service Revenue", "Project Revenue", "Consulting", "Subscriptions", "Other Income"]);
  });
  it("offers exactly the requested expense categories", () => {
    expect(categoriesFor("expense").map((c) => c.id)).toEqual(["Salaries", "Rent", "Utilities", "Marketing & Advertising", "Purchases & Inventory", "Office Supplies", "Transportation", "Software & Technology", "Maintenance", "Taxes & Fees", "Professional Services", "Other Expenses"]);
  });
  it("does not allow new custom or wrong-type categories", () => {
    expect(validTransactionCategory("Rent", "income")).toBe(false);
    expect(validTransactionCategory("Consulting", "expense")).toBe(false);
    expect(validTransactionCategory("Custom", "expense")).toBe(false);
    expect(validTransactionCategory("Rent", "expense")).toBe(true);
  });
  it("retains a legacy category only on its existing transaction type", () => {
    const initial = { category: "Historical Office", type: "expense" as const };
    expect(validTransactionCategory("Historical Office", "expense", initial)).toBe(true);
    expect(validTransactionCategory("Historical Office", "income", initial)).toBe(false);
    expect(validTransactionCategory("Another Custom", "expense", initial)).toBe(false);
    expect(categoryLabel(initial.category, "ar")).toBe("Historical Office");
  });
  it("requires a predefined expense category for new invoice expense approvals", () => {
    expect(isStandardCategory("Office Supplies", "expense")).toBe(true);
    expect(isStandardCategory("Product Sales", "expense")).toBe(false);
    expect(isStandardCategory("Unclassified", "expense")).toBe(false);
  });
  it("keeps saved identities and financial totals unchanged across languages", () => {
    const txs: Tx[] = [
      { id: "income", type: "income", amount: 300, category: "Product Sales", description: null, occurred_on: "2026-10-31" },
      { id: "invoice-expense", type: "expense", amount: 100, category: "Office Supplies", description: null, occurred_on: "2026-10-31" },
    ];
    const dashboard = categoryBreakdown(txs);
    const intelligence = analyze(txs, { from: "2026-10-01", to: "2026-10-31" });
    expect(totals(txs)).toEqual({ revenue: 300, expenses: 100, net: 200 });
    expect(dashboard[0]?.category).toBe("Office Supplies");
    expect(intelligence.categories[0]?.category).toBe("Office Supplies");
    expect(categoryLabel("Office Supplies", "ar")).toBe("اللوازم المكتبية");
    expect(categoryLabel("Office Supplies", "en")).toBe("Office Supplies");
    expect(txs[1]?.category).toBe("Office Supplies");
  });
});