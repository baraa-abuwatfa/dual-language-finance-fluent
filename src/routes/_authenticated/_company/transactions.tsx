import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { z } from "zod";
import { TransactionDialog } from "@/components/app/TransactionDialog";
import { EmptyState, PageError, PageHeader, PageNotFound, Panel, selectClass } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import type { Tx } from "@/lib/finance/metrics";
import { canEdit, formatAmount, transactionsQuery } from "@/lib/finance/queries";
import { categoryLabel } from "@/lib/finance/categories";

const search = z.object({ q: z.string().optional(), type: z.enum(["income", "expense"]).optional(), category: z.string().optional(), new: z.enum(["income", "expense"]).optional() });

export const Route = createFileRoute("/_authenticated/_company/transactions")({
  validateSearch: search,
  head: () => authHead("Transactions", "Record and review your company's income and expenses."),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery(context.company.id)),
  component: Transactions,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Transactions() {
  const { t, locale } = useAppCopy();
  const { company } = useCompany();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const { data: txs } = useSuspenseQuery(transactionsQuery(company.id));
  const [editing, setEditing] = useState<Tx | null>(null);
  const [manual, setManual] = useState(false);
  const editable = canEdit(company.role);
  const categories = useMemo(() => [...new Set(txs.map((x) => x.category))].sort(), [txs]);
  const q = (s.q ?? "").toLowerCase();
  const rows = txs.filter((x) => (!s.type || x.type === s.type) && (!s.category || x.category === s.category) && (!q || x.category.toLowerCase().includes(q) || categoryLabel(x.category, locale).toLowerCase().includes(q) || (x.description ?? "").toLowerCase().includes(q)));
  const open = editable && (manual || !!editing || !!s.new);
  const close = (o: boolean) => { if (!o) { setManual(false); setEditing(null); if (s.new) void navigate({ search: (p) => ({ ...p, new: undefined }), replace: true }); } };
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("transactions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", company.id] }),
  });
  const setSearch = (patch: Partial<z.infer<typeof search>>) => navigate({ search: (p) => ({ ...p, ...patch }), replace: true });
  const fmt = (v: number) => formatAmount(v, company.currency);

  return <>
    <PageHeader title={t.nav.transactions} description={editable ? undefined : t.readOnly} action={editable && <Button onClick={() => setManual(true)} className="bg-steel text-on-navy hover:bg-steel/90"><Plus />{t.newTx}</Button>} />
    <Panel>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input aria-label={t.search} placeholder={t.search} value={s.q ?? ""} onChange={(e) => setSearch({ q: e.target.value || undefined })} className="h-10 ps-9" /></div>
        <select aria-label={t.type} className={selectClass} value={s.type ?? ""} onChange={(e) => setSearch({ type: (e.target.value || undefined) as "income" | undefined })}><option value="">{t.allTypes}</option><option value="income">{t.income}</option><option value="expense">{t.expense}</option></select>
        <select aria-label={t.category} className={selectClass} value={s.category ?? ""} onChange={(e) => setSearch({ category: e.target.value || undefined })}><option value="">{t.allCategories}</option>{categories.map((c) => <option key={c} value={c}>{categoryLabel(c, locale)}</option>)}</select>
      </div>
      {remove.isError && <p role="alert" className="mb-3 text-sm text-negative">{t.failed}</p>}
      {txs.length === 0 ? <EmptyState text={t.recentEmpty} /> : rows.length === 0 ? <EmptyState text={t.noMatch} /> :
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-start font-medium">{t.date}</th><th className="px-4 py-2 text-start font-medium">{t.type}</th><th className="px-4 py-2 text-start font-medium">{t.category}</th><th className="px-4 py-2 text-start font-medium">{t.description}</th><th className="px-4 py-2 text-end font-medium">{t.amount}</th>{editable && <th className="px-4 py-2 text-end font-medium"><span className="sr-only">{t.actions}</span></th>}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((x) => <tr key={x.id} className="transition-colors hover:bg-background">
                <td className="num px-4 py-3 text-start text-muted-foreground">{x.occurred_on}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${x.type === "income" ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"}`}>{t[x.type]}</span></td>
                <td className="px-4 py-3">{categoryLabel(x.category, locale)}</td>
                <td className="max-w-[16rem] truncate px-4 py-3 text-muted-foreground">{x.description}</td>
                <td className={`num px-4 py-3 text-end font-semibold ${x.type === "income" ? "text-positive" : "text-negative"}`}>{x.type === "income" ? "+" : "−"}{fmt(x.amount)}</td>
                {editable && <td className="px-4 py-3 text-end whitespace-nowrap">
                  <Button variant="ghost" size="icon" aria-label={`${t.edit}: ${categoryLabel(x.category, locale)}`} onClick={() => setEditing(x)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label={`${t.delete}: ${categoryLabel(x.category, locale)}`} disabled={remove.isPending} onClick={() => { if (window.confirm(t.deleteConfirm)) remove.mutate(x.id); }}><Trash2 className="text-negative" /></Button>
                </td>}
              </tr>)}
            </tbody>
          </table>
        </div>}
    </Panel>
    <TransactionDialog open={open} onOpenChange={close} initial={editing} defaultType={s.new ?? "expense"} />
  </>;
}
