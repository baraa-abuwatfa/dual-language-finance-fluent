import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { canEdit, invoicesQuery } from "@/lib/finance/queries";

const TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX = 10 * 1024 * 1024;

export const Route = createFileRoute("/_authenticated/_company/invoices")({
  head: () => authHead("Invoices", "Upload and manage your company's invoice files."),
  loader: ({ context }) => context.queryClient.ensureQueryData(invoicesQuery(context.company.id)),
  component: Invoices,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Invoices() {
  const { t } = useAppCopy();
  const { company } = useCompany();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const { data: invoices } = useSuspenseQuery(invoicesQuery(company.id));
  const editable = canEdit(company.role);
  const refresh = () => qc.invalidateQueries({ queryKey: ["invoices", company.id] });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!TYPES.includes(file.type)) throw new Error("fileType");
      if (file.size > MAX) throw new Error("fileTooLarge");
      const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `${company.id}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("invoices").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { error: rowError } = await supabase.from("invoices").insert({ company_id: company.id, file_name: file.name.slice(0, 200), file_path: path, file_size: file.size });
      if (rowError) { await supabase.storage.from("invoices").remove([path]); throw rowError; }
    },
    onSettled: () => { if (input.current) input.current.value = ""; },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (inv: { id: string; file_path: string }) => {
      const { error } = await supabase.from("invoices").delete().eq("id", inv.id); if (error) throw error;
      await supabase.storage.from("invoices").remove([inv.file_path]);
    },
    onSuccess: refresh,
  });
  async function openFile(path: string) {
    const { data } = await supabase.storage.from("invoices").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }
  const uploadError = upload.error?.message === "fileType" ? t.fileType : upload.error?.message === "fileTooLarge" ? t.fileTooLarge : upload.error ? t.failed : null;

  return <>
    <PageHeader title={t.nav.invoices} description={editable ? t.invoicesIntro : t.readOnly} />
    {editable && <Panel>
      <label htmlFor="invoice-file" className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-mist bg-background p-8 text-center transition-colors hover:border-steel focus-within:border-steel">
        <span className="flex size-12 items-center justify-center rounded-full bg-champagne-soft text-steel">{upload.isPending ? <LoaderCircle className="animate-spin" /> : <Upload />}</span>
        <span className="text-sm font-semibold text-navy">{upload.isPending ? t.uploading : t.chooseFile}</span>
        <span className="text-xs text-muted-foreground">PDF · PNG · JPG · WEBP · 10 MB</span>
        <input ref={input} id="invoice-file" type="file" accept={TYPES.join(",")} className="sr-only" disabled={upload.isPending} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }} />
      </label>
      {uploadError && <p role="alert" className="mt-3 text-sm text-negative">{uploadError}</p>}
    </Panel>}
    <Panel>
      {remove.isError && <p role="alert" className="mb-3 text-sm text-negative">{t.failed}</p>}
      {invoices.length === 0 ? <EmptyState text={t.noInvoices} icon={<FileText />} /> : <ul className="divide-y divide-border">
        {invoices.map((inv) => <li key={inv.id} className="flex items-center gap-3 py-3">
          <FileText className="size-5 shrink-0 text-steel" aria-hidden="true" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-navy" dir="auto">{inv.file_name}</p><p className="num text-xs text-muted-foreground">{(inv.file_size / 1024).toFixed(0)} KB · {inv.created_at.slice(0, 10)}</p></div>
          <Button variant="ghost" size="icon" aria-label={`${t.open}: ${inv.file_name}`} onClick={() => void openFile(inv.file_path)}><ExternalLink /></Button>
          {editable && <Button variant="ghost" size="icon" aria-label={`${t.delete}: ${inv.file_name}`} disabled={remove.isPending} onClick={() => { if (window.confirm(t.deleteInvoice)) remove.mutate(inv); }}><Trash2 className="text-negative" /></Button>}
        </li>)}
      </ul>}
    </Panel>
  </>;
}
