import { describe, expect, it } from "vitest";
import { duplicateIdentity, reviewSchema, validateInvoiceFile } from "./rules";
const review = { supplier_name: "Supplier", invoice_number: "INV-1", invoice_date: "2026-10-29", due_date: null, currency: "USD", subtotal: 100, tax_amount: 15, total_amount: 115, expense_category: "Office" };
describe("invoice financial rules", () => {
  it("accepts PDF JPG/JPEG and PNG uploads", () => {
    for (const type of ["application/pdf", "image/jpeg", "image/png"]) expect(() => validateInvoiceFile(type, 1024)).not.toThrow();
    expect(() => validateInvoiceFile("image/webp", 1024)).toThrow("fileType");
  });
  it("rejects empty and over-limit uploads", () => {
    expect(() => validateInvoiceFile("application/pdf", 0)).toThrow();
    expect(() => validateInvoiceFile("application/pdf", 10 * 1024 * 1024 + 1)).toThrow();
  });
  it("requires supplier and invoice number before confirmation", () => {
    expect(reviewSchema.safeParse(review).success).toBe(true);
    expect(reviewSchema.safeParse({ ...review, supplier_name: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...review, invoice_number: "" }).success).toBe(false);
  });
  it("rejects mismatched subtotal tax and total", () => expect(reviewSchema.safeParse({ ...review, total_amount: 120 }).success).toBe(false));
  it("rejects negative or zero expenses", () => {
    expect(reviewSchema.safeParse({ ...review, subtotal: -1 }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...review, subtotal: 0, tax_amount: 0, total_amount: 0 }).success).toBe(false);
  });
  it("normalizes supplier and invoice identifiers for duplicate checks", () => {
    expect(duplicateIdentity(" ACME Trading ", "Inv - 1")).toBe(duplicateIdentity("acme trading", "INV-1"));
    expect(duplicateIdentity("Other", "INV-1")).not.toBe(duplicateIdentity("Acme", "INV-1"));
  });
  it("allows absent due date and rejects impossible invoice dates", () => {
    expect(reviewSchema.safeParse(review).success).toBe(true);
    expect(reviewSchema.safeParse({ ...review, invoice_date: "2026-02-30" }).success).toBe(false);
  });
});