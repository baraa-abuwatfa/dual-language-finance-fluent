import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, FileText, LoaderCircle, Upload, Search } from "lucide-react";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel, selectClass } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { canEdit } from "@/lib/finance/queries";
import { invoiceHistoryQuery } from "@/lib/invoices/data";
import { invoiceCopy, invoiceError } from "@/lib/invoices/copy";
import { invoiceTypes, invoiceStatuses, validateInvoiceFile } from "@/lib/invoices/rules";
import { Input } from "@/components/ui/input";
import { InvoiceReview } from "@/components/app/InvoiceReview";

export const Route = createFileRoute("/_authenticated/_company/invoices")({
  head: () => authHead("Invoices", "Upload and manage your company's invoice files."),
  loader: ({ context }) => context.queryClient.ensureQueryData(invoiceHistoryQuery(context.company.id)),
  component: Invoices,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Invoices() {
  const { locale } = useAppCopy(); const t = invoiceCopy[locale];
  const { company } = useCompany();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const { data: invoices } = useSuspenseQuery(invoiceHistoryQuery(company.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all");
  const active = invoices.find((i) => i.id === selected);
  const filtered = invoices.filter((i) => (status === "all" || status === i.status) && [i.file_name, i.supplier_name, i.invoice_number, i.expense_category].some((v) => v?.toLowerCase().includes(search.toLowerCase())));
  const editable = canEdit(company.role);
  const refresh = () => qc.invalidateQueries({ queryKey: ["invoices", company.id] });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      validateInvoiceFile(file.type, file.size);
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
  async function openFile(path: string) {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const { data, error } = await supabase.storage.from("invoices").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { tab?.close(); setOpenError(true); return; }
    if (tab) tab.location.href = data.signedUrl;
  }
  const [openError, setOpenError] = useState(false);
  const uploadError = upload.error ? invoiceError(upload.error, t) : null;

  return <>
    <PageHeader title={t.title} description={editable ? t.intro : t.readonly} />
    {editable && <Panel>
      <label htmlFor="invoice-file" className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-mist bg-background p-8 text-center transition-colors hover:border-steel focus-within:border-steel">
        <span className="flex size-12 items-center justify-center rounded-full bg-champagne-soft text-steel">{upload.isPending ? <LoaderCircle className="animate-spin" /> : <Upload />}</span>
        <span className="text-sm font-semibold text-navy">{upload.isPending ? t.working : t.upload}</span>
        <bdi className="num text-xs text-muted-foreground">{t.formats}</bdi>
        <input ref={input} id="invoice-file" type="file" accept={invoiceTypes.join(",")} className="sr-only" disabled={upload.isPending} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }} />
      </label>
      {uploadError && <p role="alert" className="mt-3 text-sm text-negative">{uploadError}</p>}
    </Panel>}
    <Panel>
      <div className="mb-4 flex flex-wrap gap-3"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground" /><Input className="ps-9" aria-label={t.search} placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} /></div><select className={selectClass + " max-w-full"} aria-label={t.all} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">{t.all}</option>{invoiceStatuses.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}</select></div>
      {openError && <p role="alert" className="text-sm text-negative">{t.failed}</p>}
      {invoices.length === 0 ? <EmptyState text={t.empty} icon={<FileText />} /> : filtered.length === 0 ? <EmptyState text={t.noMatch} /> : <ul className="divide-y divide-border">
        {filtered.map((inv) => <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
          <FileText className="size-5 shrink-0 text-steel" aria-hidden="true" />
           <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-navy" dir="auto">{inv.supplier_name || inv.file_name}</p><p className="num text-xs text-muted-foreground">{inv.invoice_number ? `${inv.invoice_number} · ` : ""}{(inv.file_size / 1024).toFixed(0)} KB · {inv.created_at.slice(0, 10)}</p><p className={`mt-1 text-xs font-semibold ${inv.status === "approved" ? "text-positive" : inv.status === "failed" ? "text-negative" : "text-steel"}`}>{t.status[inv.status]}</p></div>
          <Button variant="ghost" size="icon" aria-label={`${t.open}: ${inv.file_name}`} onClick={() => void openFile(inv.file_path)}><ExternalLink /></Button>
           <Button variant="subtle" aria-label={`${t.review}: ${inv.file_name}`} onClick={() => setSelected(inv.id)}><FileText />{t.review}</Button>
        </li>)}
      </ul>}
    </Panel>
    {active && <InvoiceReview key={active.id} invoice={active} history={invoices} onClose={() => setSelected(null)} />}
  </>;
}
