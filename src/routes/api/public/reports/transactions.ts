// POST /api/public/reports/transactions — called by the n8n Monthly
// Financial Report workflow.
// Input:  { company_id, start_date, end_date, page?, page_size? }
// Output: { data: [{ id, company_id, type, amount, transaction_date,
//           category, description, currency }], page, page_size, total, has_more }
// Auth:   x-report-token header must match the N8N_REPORT_TOKEN secret.
import { createFileRoute } from "@tanstack/react-router";
import { errorJson, isIsoDate, isUuid, json, readJsonBody, requireReportToken } from "@/lib/reports/report-auth";

const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 100;

export const Route = createFileRoute("/api/public/reports/transactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await requireReportToken(request);
        if (authError) return authError;

        const body = await readJsonBody(request);
        if (!body || !isUuid(body["company_id"])) {
          return errorJson("company_id must be a valid UUID", 400);
        }
        if (!isIsoDate(body["start_date"]) || !isIsoDate(body["end_date"])) {
          return errorJson("start_date and end_date must be YYYY-MM-DD", 400);
        }
        const startDate = body["start_date"] as string;
        const endDate = body["end_date"] as string;
        if (startDate > endDate) {
          return errorJson("start_date must not be after end_date", 400);
        }
        const page = Number.isInteger(body["page"]) && (body["page"] as number) >= 1 ? (body["page"] as number) : 1;
        const pageSize = Number.isInteger(body["page_size"]) && (body["page_size"] as number) >= 1
          ? Math.min(body["page_size"] as number, MAX_PAGE_SIZE)
          : DEFAULT_PAGE_SIZE;

        const companyId = body.company_id;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Verify the company exists and get its currency before reading data.
        const { data: company, error: companyError } = await supabaseAdmin
          .from("companies")
          .select("id, primary_currency")
          .eq("id", companyId)
          .maybeSingle();
        if (companyError) {
          console.error("[reports/transactions] company lookup failed", companyError.message);
          return errorJson("Company lookup failed", 500);
        }
        if (!company) return errorJson("Company not found", 404);
        const currency = company.primary_currency.trim();

        // Strictly scoped to the requested company and date range.
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await supabaseAdmin
          .from("transactions")
          .select("id, company_id, type, amount, occurred_on, category, description", { count: "exact" })
          .eq("company_id", companyId)
          .gte("occurred_on", body["start_date"] as string)
          .lte("occurred_on", body["end_date"] as string)
          .order("occurred_on", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to);
        if (error) {
          console.error("[reports/transactions] query failed", error.message);
          return errorJson("Transactions query failed", 500);
        }

        const rows = (data ?? []).map((t) => ({
          id: t.id,
          company_id: t.company_id,
          type: t.type,
          amount: t.amount,
          transaction_date: t.occurred_on,
          category: t.category,
          description: t.description,
          currency,
        }));

        const total = count ?? 0;
        return json({
          data: rows,
          page,
          page_size: pageSize,
          total,
          has_more: from + rows.length < total,
        });
      },
    },
  },
});
