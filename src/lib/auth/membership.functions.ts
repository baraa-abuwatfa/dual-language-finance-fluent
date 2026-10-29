import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { companyDestination } from "./rules";

export type CompanySummary = { id: string; name: string; currency: string; role: "owner" | "admin" | "finance_manager" | "viewer" };

export const getCompanyAccess = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const empty = { destination: null, companyName: null, currency: null, companies: [] as CompanySummary[] };
  const { data, error } = await context.supabase.from("company_members").select("company_id, status, role, companies(name, primary_currency)").eq("user_id", context.userId).eq("status", "active");
  if (error || !data) return empty;
  const companies: CompanySummary[] = data.flatMap((m) => m.companies ? [{ id: m.company_id, name: m.companies.name, currency: m.companies.primary_currency.trim(), role: m.role }] : []);
  const destination = companyDestination(data);
  const single = destination === "/workspace" ? companies[0] : undefined;
  return { destination, companyName: single?.name ?? null, currency: single?.currency ?? null, companies };
});
