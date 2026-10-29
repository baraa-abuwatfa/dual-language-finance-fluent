import { queryOptions } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { InvoiceStatus, Review } from "./rules";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & Partial<Review> & {
  status: InvoiceStatus; processing_error: string | null; error_code: string | null;
  transaction_id: string | null; approved_at: string | null; approved_by: string | null;
};
export type InvoiceDatabase = Omit<Database, "public"> & { public: Omit<Database["public"], "Tables" | "Functions"> & {
  Tables: Omit<Database["public"]["Tables"], "invoices"> & { invoices: {
    Row: Invoice; Insert: Database["public"]["Tables"]["invoices"]["Insert"]; Update: Partial<Invoice>;
    Relationships: Database["public"]["Tables"]["invoices"]["Relationships"];
  }};
  Functions: Database["public"]["Functions"] & { manage_invoice: { Args: { _id: string; _action: string; _data?: Record<string, unknown> }; Returns: string } };
}};
export const invoiceClient = supabase as unknown as SupabaseClient<InvoiceDatabase>;
export const invoiceHistoryQuery = (companyId: string) => queryOptions({
  queryKey: ["invoices", companyId],
  queryFn: async () => {
    // Selecting the existing columns first preserves old upload history before the migration is applied.
    const { data, error } = await invoiceClient.from("invoices").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((i) => ({ ...i, status: i.status ?? "uploaded" }));
  },
});
export async function invoiceAction(id: string, action: string, data: Record<string, unknown> = {}) {
  const { data: result, error } = await invoiceClient.rpc("manage_invoice", { _id: id, _action: action, _data: data });
  if (error) throw error;
  return result;
}