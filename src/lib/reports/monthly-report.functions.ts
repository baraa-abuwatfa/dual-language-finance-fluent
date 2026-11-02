import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildMonthlyReportPayload, validateMonthlyReportInput, type MonthlyReportInput } from "./monthly-report";

// Triggers the n8n Monthly Financial Report workflow for the caller's company.
// Security: the caller must be signed in and an ACTIVE OWNER of the company.
// The delivery email is the owner's own verified session email — it is never
// taken from the request body. The n8n webhook secret stays server-side only.
export const requestMonthlyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: MonthlyReportInput) => data)
  .handler(async ({ context, data }) => {
    const invalid = validateMonthlyReportInput(data);
    if (invalid) return { ok: false as const, error: invalid };

    const { data: membership, error: membershipError } = await context.supabase
      .from("company_members")
      .select("role, status")
      .eq("company_id", data.companyId)
      .eq("user_id", context.userId)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) {
      console.error("[monthly-report] membership check failed", membershipError.message);
      return { ok: false as const, error: "membership_check_failed" };
    }
    if (!membership || membership.role !== "owner") {
      return { ok: false as const, error: "owner_required" };
    }

    const deliveryEmail = typeof context.claims.email === "string" ? context.claims.email : null;
    if (!deliveryEmail) return { ok: false as const, error: "email_unavailable" };

    const webhookUrl = process.env["N8N_WEBHOOK_URL"];
    const webhookSecret = process.env["N8N_WEBHOOK_SECRET"];
    if (!webhookUrl || !webhookSecret) {
      console.error("[monthly-report] N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET is not configured");
      return { ok: false as const, error: "not_configured" };
    }

    const payload = buildMonthlyReportPayload(data, context.userId, deliveryEmail);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-cfo-report-key": webhookSecret,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[monthly-report] n8n webhook failed [${res.status}]: ${text}`);
        return { ok: false as const, error: "webhook_failed" };
      }
    } catch (err) {
      console.error("[monthly-report] n8n webhook unreachable", err);
      return { ok: false as const, error: "webhook_unreachable" };
    }

    return { ok: true as const };
  });
