import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, LoaderCircle, ScanLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompany, useAppCopy } from "@/lib/company/use-company";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { invoiceAction, type Invoice } from "@/lib/invoices/data";
import { invoiceCopy, invoiceError } from "@/lib/invoices/copy";
import { extractInvoice } from "@/lib/invoices/extraction.functions";
import { duplicateIdentity, parseReview, type Review } from "@/lib/invoices/rules";
import { canEdit } from "@/lib/finance/queries";
import { confirmInvoice } from "@/lib/invoices/confirmation";
import { CategorySelect } from "./CategorySelect";
import { categoryCopy, isStandardCategory } from "@/lib/finance/categories";

const fields = ["supplier_name", "invoice_number", "invoice_date", "due_date", "currency", "subtotal", "tax_amount", "total_amount", "expense_category"] as const;
type Draft = Record<typeof fields[number], string>;
const amounts = ["subtotal", "tax_amount", "total_amount"];
export function InvoiceReview({ invoice, history, onClose }: { invoice: Invoice; history: Invoice[]; onClose: () => void }) {
  const { company } = useCompany(); const { locale } = useAppCopy(); const { dir } = useI18n(); const t = invoiceCopy[locale];
  const qc = useQueryClient(); const extract = useServerFn(extractInvoice);
  const [draft, setDraft] = useState<Draft>(() => Object.fromEntries(fields.map((f) => [f, invoice[f] == null ? "" : String(invoice[f])])) as Draft);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const editable = canEdit(company.role) && invoice.status !== "approved";
  const configured = invoice.processing_ready !== false;
  const refresh = () => qc.invalidateQueries({ queryKey: ["invoices", company.id] });
  const processing = useMutation({
    mutationFn: () => extract({ data: { id: invoice.id } }),
    onSuccess: async (result) => {
      await refresh();
      if (result.ok) {
        const updated = qc.getQueryData<Invoice[]>(["invoices", company.id])?.find((i) => i.id === invoice.id);
        if (updated) setDraft(Object.fromEntries(fields.map((f) => [f, updated[f] == null ? "" : String(updated[f])])) as Draft);
        setError(null);
      } else setError(result.message ?? (result.code === "configuration" ? t.missingAI : invoiceError({ code: result.code }, t)));
    },
    onError: () => setError(t.failed),
  });
  const save = useMutation({
    mutationFn: async ({ review, approve }: { review: Review; approve: boolean }) => {
      await confirmInvoice(invoice.id, review, approve, invoiceAction);
    },
    onSuccess: async (_, v) => {
      await refresh();
      if (v.approve) { await qc.invalidateQueries({ queryKey: ["transactions", company.id] }); onClose(); }
      else setSaved(true);
      setError(null);
    },
    onError: async (e) => { setSaved(false); setError(invoiceError(e, t)); await refresh(); },
  });
  const busy = save.isPending || processing.isPending;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const parsed = parseReview(draft);
    if (!parsed.success) { setSaved(false); setError(t.invalid); return; }
    if (history.some((i) => i.id !== invoice.id && i.supplier_name && i.invoice_number && duplicateIdentity(i.supplier_name, i.invoice_number) === duplicateIdentity(parsed.data.supplier_name, parsed.data.invoice_number))) { setError(t.duplicate); return; }
    const approve = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "approve";
    if (approve && !isStandardCategory(parsed.data.expense_category, "expense")) { setError(categoryCopy[locale].invalid); return; }
    if (approve && parsed.data.currency !== company.currency.toUpperCase()) { setError(t.currencyMismatch); return; }
    save.mutate({ review: parsed.data, approve });
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent dir={dir} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle className="text-navy">{t.review}</DialogTitle></DialogHeader>
      <p className="break-all text-sm text-muted-foreground" dir="auto">{invoice.file_name}</p>
      <div className="flex flex-wrap items-center gap-2"><span role="status" className="text-sm font-semibold text-steel">{processing.isPending ? t.status.processing : t.status[invoice.status]}</span>
        {editable && <Button variant="subtle" disabled={!configured || busy || invoice.status === "processing" || invoice.error_code === "402" || invoice.error_code === "403"} onClick={() => { setSaved(false); processing.mutate(); }}><ScanLine />{t.extract}</Button>}
      </div>
      {!configured && <p role="alert" className="text-sm text-negative">{t.setup}</p>}
      {invoice.processing_error && <p role="alert" className="break-words text-sm text-negative">{invoice.error_code === "23505" ? t.duplicate : invoice.processing_error}</p>}
      <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
        <fieldset disabled={!editable || busy} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => <div key={f} className="min-w-0"><label htmlFor={`inv-${f}`} className="mb-1.5 block text-sm font-semibold text-navy">{t[f]}</label>
            {f === "expense_category" ? <CategorySelect id={`inv-${f}`} type="expense" value={draft[f]} legacy={draft[f]} disabled={!editable || busy} onChange={(expense_category) => { setSaved(false); setDraft((d) => ({ ...d, expense_category })); }} /> : <Input id={`inv-${f}`} value={draft[f]} onChange={(e) => { setSaved(false); setDraft((d) => ({ ...d, [f]: e.target.value })); }} type={f.endsWith("date") ? "date" : amounts.includes(f) ? "number" : "text"} step={amounts.includes(f) ? "0.01" : undefined} min={amounts.includes(f) ? 0 : undefined} maxLength={f === "currency" ? 3 : f === "supplier_name" ? 200 : f === "invoice_number" ? 100 : 60} dir={f === "supplier_name" ? "auto" : "ltr"} required={f !== "due_date"} />}
          </div>)}
        </fieldset>
        {invoice.transaction_id && <p className="break-all text-sm text-positive">{t.transaction}: <bdi className="num">{invoice.transaction_id}</bdi></p>}
        {error && <p role="alert" className="break-words text-sm text-negative">{error}</p>}
        {saved && !error && <p role="status" className="text-sm text-positive">{t.saved}</p>}
        {editable && <><p className="text-sm text-muted-foreground">{t.notice}</p><div className="flex flex-wrap justify-end gap-2">
          <Button type="submit" variant="subtle" value="save" disabled={busy || !configured}>{t.save}</Button>
          <Button type="submit" value="approve" disabled={busy || !configured}>{busy ? <LoaderCircle className="animate-spin" /> : <Check />}{t.approve}</Button>
        </div></>}
      </form>
    </DialogContent>
  </Dialog>;
}