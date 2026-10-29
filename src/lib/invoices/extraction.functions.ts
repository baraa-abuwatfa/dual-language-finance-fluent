import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceDatabase } from "./data";

export const extractInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as SupabaseClient<InvoiceDatabase>;
    const { data: inv, error } = await client.from("invoices").select("*").eq("id", data.id).single();
    if (error || !inv) return { ok: false, code: "access", message: null };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, code: "configuration", message: null };
    const { data: blocked, error: blockedError } = await client.from("invoices").select("processing_error, error_code").eq("company_id", inv.company_id).in("error_code", ["402", "403"]).limit(1);
    if (blockedError) return { ok: false, code: blockedError.code, message: null };
    if (blocked?.[0]) return { ok: false, code: blocked[0].error_code, message: blocked[0].processing_error };
    const { error: startError } = await client.rpc("manage_invoice", { _id: data.id, _action: "start" });
    if (startError) return { ok: false, code: startError.code, message: null };
    try {
      const { data: blob, error: downloadError } = await client.storage.from("invoices").download(inv.file_path);
      if (downloadError || !blob) throw new Error("Invoice file could not be read.");
      const { extractFromFile } = await import("./server/extract.server");
      const fields = await extractFromFile(getRequest(), key, inv.file_name, blob);
      const { error: saveError } = await client.rpc("manage_invoice", { _id: data.id, _action: "extracted", _data: fields });
      if (saveError) {
        const message = saveError.code === "23505" ? "duplicate_invoice" : "Invoice data needs manual review.";
        await client.rpc("manage_invoice", { _id: data.id, _action: "fail", _data: { code: saveError.code, message } });
        return { ok: false, code: saveError.code, message: null };
      }
      return { ok: true, code: null, message: null };
    } catch (error) {
      const { safeExtractionError } = await import("./server/extract.server");
      const safe = safeExtractionError(error);
      await client.rpc("manage_invoice", { _id: data.id, _action: "fail", _data: safe });
      return { ok: false, code: safe.code, message: safe.message };
    }
  });