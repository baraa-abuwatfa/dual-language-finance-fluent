import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { todayIso } from "@/lib/finance/queries";
import type { Tx } from "@/lib/finance/metrics";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { selectClass } from "./ui";
import { CategorySelect } from "./CategorySelect";
import { validTransactionCategory } from "@/lib/finance/categories";

export const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number({ invalid_type_error: "invalidAmount" }).positive("invalidAmount").max(999999999999, "invalidAmount"),
  category: z.string().trim().min(1, "invalidCategory").max(60, "tooLong"),
  description: z.string().trim().max(300, "tooLong"),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
});
type Field = keyof z.infer<typeof txSchema>;
type Draft = Record<Field, string>;

export function TransactionDialog({ open, onOpenChange, initial, defaultType = "expense" }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Tx | null; defaultType?: "income" | "expense" }) {
  const { t } = useAppCopy();
  const { dir } = useI18n();
  const { company } = useCompany();
  const qc = useQueryClient();
  const blank = (): Draft => initial ? { type: initial.type, amount: String(initial.amount), category: initial.category, description: initial.description ?? "", occurred_on: initial.occurred_on } : { type: defaultType, amount: "", category: "", description: "", occurred_on: todayIso() };
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  useEffect(() => { if (open) { setDraft(blank()); setErrors({}); } }, [open, initial, defaultType]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async (v: z.infer<typeof txSchema>) => {
      const row = { ...v, description: v.description || null };
      const { error } = initial ? await supabase.from("transactions").update(row).eq("id", initial.id) : await supabase.from("transactions").insert({ ...row, company_id: company.id });
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["transactions", company.id] }); onOpenChange(false); },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const parsed = txSchema.safeParse(draft);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]))); return; }
    if (!validTransactionCategory(parsed.data.category, parsed.data.type, initial)) { setErrors({ category: "invalidCategory" }); return; }
    setErrors({}); save.mutate(parsed.data);
  }
  const msg = (f: Field) => errors[f] && <p id={`tx-${f}-err`} role="alert" className="mt-1 text-xs text-negative">{t[errors[f] as "invalidAmount"] ?? t.failed}</p>;
  const set = (f: Field) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [f]: e.target.value }));
  const label = "mb-1.5 block text-sm font-semibold text-navy";

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent dir={dir} className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <DialogHeader><DialogTitle className="text-navy">{initial ? t.editTx : t.newTx}</DialogTitle></DialogHeader>
      <form onSubmit={submit} noValidate className="space-y-4" aria-busy={save.isPending}>
        <fieldset className="grid grid-cols-2 gap-2"><legend className={label}>{t.type}</legend>
          {(["income", "expense"] as const).map((k) => <label key={k} className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors ${draft.type === k ? k === "income" ? "border-positive bg-positive-soft text-positive" : "border-negative bg-negative-soft text-negative" : "border-input"}`}>
            <input type="radio" name="type" value={k} checked={draft.type === k} disabled={save.isPending} onChange={() => setDraft((d) => ({ ...d, type: k, category: d.type === k ? d.category : "" }))} className="sr-only" />{t[k]}
          </label>)}
        </fieldset>
        <div><label htmlFor="tx-amount" className={label}>{t.amount} <span className="num text-muted-foreground">({company.currency})</span></label><Input id="tx-amount" inputMode="decimal" dir="ltr" value={draft.amount} onChange={set("amount")} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "tx-amount-err" : undefined} />{msg("amount")}</div>
        <div><label htmlFor="tx-category" className={label}>{t.category}</label><CategorySelect id="tx-category" type={draft.type === "income" ? "income" : "expense"} value={draft.category} legacy={initial?.type === draft.type ? initial.category : undefined} disabled={save.isPending} onChange={(category) => setDraft((d) => ({ ...d, category }))} invalid={!!errors.category} describedBy={errors.category ? "tx-category-err" : undefined} />{msg("category")}</div>
        <div><label htmlFor="tx-date" className={label}>{t.date}</label><Input id="tx-date" type="date" dir="ltr" value={draft.occurred_on} onChange={set("occurred_on")} className={selectClass + " w-full"} aria-invalid={!!errors.occurred_on} />{msg("occurred_on")}</div>
        <div><label htmlFor="tx-desc" className={label}>{t.description}</label><Input id="tx-desc" maxLength={300} value={draft.description} onChange={set("description")} />{msg("description")}</div>
        {save.isError && <p role="alert" className="text-sm text-negative">{t.failed}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="subtle" onClick={() => onOpenChange(false)}>{t.cancel}</Button><Button type="submit" disabled={save.isPending} className="bg-steel text-on-navy hover:bg-steel/90">{save.isPending && <LoaderCircle className="animate-spin" />}{t.save}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
