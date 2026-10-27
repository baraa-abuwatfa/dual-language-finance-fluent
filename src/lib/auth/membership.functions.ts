import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { companyDestination } from "./rules";
export const getCompanyAccess = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("company_members").select("company_id, status").eq("user_id", context.userId).eq("status", "active");
  if (error || !data) return { destination: null, companyName: null, currency: null };
  const destination = companyDestination(data);
  if (destination !== "/workspace" || !data[0]) return { destination, companyName: null, currency: null };
  const { data: company, error: companyError } = await context.supabase.from("companies").select("name, primary_currency").eq("id", data[0].company_id).single();
  if (companyError || !company) return { destination: null, companyName: null, currency: null };
  return { destination, companyName: company.name, currency: company.primary_currency.trim() };
});