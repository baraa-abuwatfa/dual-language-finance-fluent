import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { FinancialReport } from "./report-model";

export const REPORTS_BUCKET = "financial-reports";

type Selection = FinancialReport["selection"];

/** company_id/year/month/monthly-report.pdf; annual reports use company_id/year/annual-report.pdf */
export function reportStoragePath(companyId: string, selection: Selection) {
  return selection.type === "monthly"
    ? `${companyId}/${selection.year}/${String(selection.month).padStart(2, "0")}/monthly-report.pdf`
    : `${companyId}/${selection.year}/annual-report.pdf`;
}

/** Metadata row for public.report_files. month = 0 marks an annual report so the
 *  unique (company_id, report_type, year, month) key dedupes repeated exports. */
export function reportFileRow(companyId: string, selection: Selection, storagePath: string) {
  return {
    company_id: companyId,
    report_type: selection.type,
    year: selection.year,
    month: selection.type === "monthly" ? selection.month : 0,
    storage_path: storagePath,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Uploads an archive copy of an exported report PDF and upserts its metadata row.
 * Runs as the signed-in user: storage.objects and report_files RLS restrict writes
 * to owner/admin/finance_manager of the company encoded in the path's first segment.
 * Re-exporting the same company/period overwrites the file and the row (no duplicates).
 */
export async function uploadReportCopy(args: { companyId: string; selection: Selection; blob: Blob }) {
  const path = reportStoragePath(args.companyId, args.selection);
  const { error: uploadError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(path, args.blob, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db
    .from("report_files")
    .upsert(reportFileRow(args.companyId, args.selection, path), { onConflict: "company_id,report_type,year,month" });
  if (error) throw error;
  return path;
}
