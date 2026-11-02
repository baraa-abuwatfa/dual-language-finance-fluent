import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildFinancialBrief } from "./context";
import type { Tx } from "@/lib/finance/metrics";

const input = z.object({
  companyId: z.string().uuid(),
  locale: z.enum(["en", "ar"]),
  question: z.string().trim().min(1).max(2000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(12),
});

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => input.parse(v))
  .handler(async ({ data, context }) => {
    // RLS scopes both queries: non-members see no membership row and no transactions.
    const { data: membership, error: memberError } = await context.supabase
      .from("company_members").select("role").eq("company_id", data.companyId).eq("user_id", context.userId).maybeSingle();
    if (memberError) return { ok: false as const, code: memberError.code, answer: null };
    if (!membership) return { ok: false as const, code: "access", answer: null };

    const { data: company } = await context.supabase.from("companies").select("name, primary_currency").eq("id", data.companyId).single();
    const { data: rows, error } = await context.supabase
      .from("transactions").select("id, type, amount, category, description, occurred_on")
      .eq("company_id", data.companyId).order("occurred_on", { ascending: false }).limit(2000);
    if (error) return { ok: false as const, code: error.code, answer: null };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, code: "configuration", answer: null };

    const brief = buildFinancialBrief((rows ?? []) as Tx[], {
      company: company?.name ?? "—", currency: company?.primary_currency ?? "USD",
      locale: data.locale, today: new Date().toISOString().slice(0, 10),
    });
    try {
      const { answerQuestion } = await import("./server/answer.server");
      const answer = await answerQuestion(getRequest(), key, brief, data.history, data.question);
      return { ok: true as const, code: null, answer };
    } catch (e) {
      const { safeAssistantError } = await import("./server/answer.server");
      const safe = safeAssistantError(e);
      return { ok: false as const, code: safe.code, answer: null };
    }
  });
