// POST /api/public/reports/company — called by the n8n Monthly Financial
// Report workflow. Input: { company_id }. Output: { id, name,
// primary_currency, owner_email }. Auth: x-report-token header must match
// the N8N_REPORT_TOKEN secret.
import { createFileRoute } from "@tanstack/react-router";
import { errorJson, isUuid, json, readJsonBody, requireReportToken } from "@/lib/reports/report-auth";

export const Route = createFileRoute("/api/public/reports/company")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await requireReportToken(request);
        if (authError) return authError;

        const body = await readJsonBody(request);
        if (!body || !isUuid(body.company_id)) {
          return errorJson("company_id must be a valid UUID", 400);
        }
        const companyId = body.company_id;

        // Service role is required here: the owner email lives in auth.users,
        // which is never readable through RLS-scoped clients.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: company, error: companyError } = await supabaseAdmin
          .from("companies")
          .select("id, name, primary_currency")
          .eq("id", companyId)
          .maybeSingle();
        if (companyError) {
          console.error("[reports/company] company lookup failed", companyError.message);
          return errorJson("Company lookup failed", 500);
        }
        if (!company) return errorJson("Company not found", 404);

        const { data: owner, error: ownerError } = await supabaseAdmin
          .from("company_members")
          .select("user_id")
          .eq("company_id", companyId)
          .eq("role", "owner")
          .eq("status", "active")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (ownerError) {
          console.error("[reports/company] owner lookup failed", ownerError.message);
          return errorJson("Owner lookup failed", 500);
        }
        if (!owner) return errorJson("Company has no active owner", 404);

        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(owner.user_id);
        if (userError || !userData.user?.email) {
          console.error("[reports/company] owner email lookup failed", userError?.message);
          return errorJson("Owner email unavailable", 500);
        }

        return json({
          id: company.id,
          name: company.name,
          primary_currency: company.primary_currency.trim(),
          owner_email: userData.user.email,
        });
      },
    },
  },
});
