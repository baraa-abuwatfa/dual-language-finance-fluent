import { z } from "zod";

export const invoiceStatuses = ["uploaded", "processing", "needs_review", "approved", "failed"] as const;
export type InvoiceStatus = typeof invoiceStatuses[number];
export const invoiceTypes = ["application/pdf", "image/jpeg", "image/png"];
export const invoiceMaxSize = 10 * 1024 * 1024;
const date = z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "invalidDate");
const money = z.number().finite().min(0).max(999999999999.99).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.001, "invalidAmount");
export const reviewSchema = z.object({
  supplier_name: z.string().trim().min(1).max(200), invoice_number: z.string().trim().min(1).max(100),
  invoice_date: date, due_date: date.nullable(), currency: z.string().regex(/^[A-Z]{3}$/),
  subtotal: money, tax_amount: money, total_amount: money.refine((v) => v > 0, "invalidAmount"),
  expense_category: z.string().trim().min(1).max(60),
}).strict().refine((v) => Math.abs(v.subtotal + v.tax_amount - v.total_amount) <= 0.01, "amountMismatch");
export type Review = z.infer<typeof reviewSchema>;
export function duplicateIdentity(supplier: string, number: string) { return [supplier, number].map((s) => s.toLowerCase().replace(/\s+/g, "").trim()).join("|"); }
export function validateInvoiceFile(type: string, size: number) {
  if (!invoiceTypes.includes(type)) throw new Error("fileType");
  if (size <= 0 || size > invoiceMaxSize) throw new Error("fileTooLarge");
}