import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDialog } from "./TransactionDialog";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { dashCopy } from "@/lib/dashboard/copy";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Tx } from "@/lib/finance/metrics";

const db = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => db } }));
vi.mock("@/lib/company/use-company", () => ({
  useCompany: () => ({ company: { id: "company-one", currency: "USD" } }),
  useAppCopy: () => { const { locale } = useI18n(); return { locale, t: dashCopy[locale] }; },
}));

beforeEach(() => {
  vi.clearAllMocks();
  db.insert.mockResolvedValue({ error: null });
  db.update.mockReturnValue({ eq: db.eq });
  db.eq.mockResolvedValue({ error: null });
  Element.prototype.scrollIntoView = vi.fn();
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

function mount(locale: "en" | "ar", type: "income" | "expense", initial?: Tx) {
  window.localStorage.setItem("aicfo.locale", locale);
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  render(<I18nProvider><QueryClientProvider client={client}><TransactionDialog open onOpenChange={() => {}} defaultType={type} {...(initial ? { initial } : {})} /></QueryClientProvider></I18nProvider>);
}

describe("Transaction category persistence", () => {
  it("clears an incompatible selection when the transaction type changes", async () => {
    mount("en", "income");
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Product Sales" }));
    fireEvent.click(screen.getByRole("radio", { name: "Expense" }));
    fireEvent.change(document.getElementById("tx-amount") as HTMLInputElement, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(db.insert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("option", { name: "Product Sales" })).toBeNull();
    fireEvent.click(await screen.findByRole("option", { name: "Rent" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ category: "Rent", type: "expense" })));
  });
  it.each(["en", "ar"] as const)("creates income and expense with stable references in %s", async (locale) => {
    mount(locale, "income");
    fireEvent.change(document.getElementById("tx-amount") as HTMLInputElement, { target: { value: "250" } });
    fireEvent.click(screen.getByRole("combobox"));
    const search = screen.getByPlaceholderText(locale === "ar" ? "ابحث عن فئة…" : "Search categories…");
    fireEvent.change(search, { target: { value: locale === "ar" ? "مبيعات" : "Product" } });
    fireEvent.click(await screen.findByRole("option", { name: locale === "ar" ? "مبيعات المنتجات" : "Product Sales" }));
    fireEvent.click(screen.getByRole("button", { name: dashCopy[locale].save }));
    await waitFor(() => expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ category: "Product Sales", type: "income", company_id: "company-one", amount: 250 })));
    cleanup();
    mount(locale, "expense");
    fireEvent.change(document.getElementById("tx-amount") as HTMLInputElement, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: locale === "ar" ? "الإيجار" : "Rent" }));
    fireEvent.click(screen.getByRole("button", { name: dashCopy[locale].save }));
    await waitFor(() => expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ category: "Rent", type: "expense", company_id: "company-one", amount: 50 })));
  });
  it.each(["en", "ar"] as const)("edits income and expense categories in %s without translating saved values", async (locale) => {
    for (const type of ["income", "expense"] as const) {
      mount(locale, type, { id: "existing-id", type, amount: 100, category: "Historical Category", description: null, occurred_on: "2026-10-31" });
      fireEvent.click(screen.getByRole("combobox"));
      fireEvent.click(await screen.findByRole("option", { name: type === "income" ? locale === "ar" ? "الاستشارات" : "Consulting" : locale === "ar" ? "الرواتب" : "Salaries" }));
      fireEvent.click(screen.getByRole("button", { name: dashCopy[locale].save }));
      await waitFor(() => expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ category: type === "income" ? "Consulting" : "Salaries", type })));
      expect(db.eq).toHaveBeenCalledWith("id", "existing-id");
      cleanup();
    }
  });
  it("preserves an unchanged historical category while editing another field", async () => {
    mount("en", "expense", { id: "old", type: "expense", amount: 100, category: "Old Category", description: null, occurred_on: "2026-10-31" });
    fireEvent.change(document.getElementById("tx-amount") as HTMLInputElement, { target: { value: "125" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ category: "Old Category", amount: 125 })));
  });
});