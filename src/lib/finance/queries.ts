import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tx } from "./metrics";

export const transactionsQuery = (companyId: string) => queryOptions({
  queryKey: ["transactions", companyId],
  queryFn: async (): Promise<Tx[]> => {
    const { data, error } = await supabase.from("transactions").select("id, type, amount, category, description, occurred_on").eq("company_id", companyId).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).range(0, 4999);
    if (error) throw error;
    return data.map((t) => ({ ...t, amount: Number(t.amount) }));
  },
});

export const invoicesQuery = (companyId: string) => queryOptions({
  queryKey: ["invoices", companyId],
  queryFn: async () => {
    const { data, error } = await supabase.from("invoices").select("id, file_name, file_path, file_size, created_at").eq("company_id", companyId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export function canEdit(role: string) { return role === "owner" || role === "admin" || role === "finance_manager"; }

export function formatAmount(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}
export function monthLabel(month: string, locale: "en" | "ar") {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}
export function todayIso() { return new Date().toISOString().slice(0, 10); }
