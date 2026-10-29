import { expect, it, vi } from "vitest";
import { confirmInvoice } from "./confirmation";
const review = { supplier_name: "Supplier", invoice_number: "INV-1", invoice_date: "2026-10-29", due_date: null, currency: "USD", subtotal: 100, tax_amount: 15, total_amount: 115, expense_category: "Office" };
it("saving review never records an expense automatically", async () => {
  const action = vi.fn().mockResolvedValue("invoice-id");
  await confirmInvoice("invoice-id", review, false, action);
  expect(action.mock.calls.map((c) => c[1])).toEqual(["review"]);
});
it("explicit confirmation requests exactly one linked expense approval", async () => {
  const action = vi.fn().mockResolvedValue("transaction-id");
  await confirmInvoice("invoice-id", review, true, action);
  expect(action.mock.calls.map((c) => [c[0], c[1]])).toEqual([["invoice-id", "review"], ["invoice-id", "approve"]]);
});
it("a failed review never reaches expense approval", async () => {
  const action = vi.fn().mockRejectedValue(new Error("duplicate_invoice"));
  await expect(confirmInvoice("invoice-id", review, true, action)).rejects.toThrow("duplicate_invoice");
  expect(action).toHaveBeenCalledTimes(1);
  expect(action).toHaveBeenCalledWith("invoice-id", "review", review);
});