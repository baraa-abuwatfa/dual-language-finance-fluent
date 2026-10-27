import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { WorkspacePlaceholder } from "@/components/auth/WorkspacePlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authHead } from "@/lib/auth/head";
import { loadCompanyAccess } from "@/lib/auth/access";
import { CURRENCIES, companySchema } from "@/lib/auth/rules";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dashCopy } from "@/lib/dashboard/copy";

export const Route = createFileRoute("/_authenticated/company-setup")({
  head: () => authHead("Company setup", "Create your company in AI CFO."),
  loader: () => loadCompanyAccess("/company-setup"),
  component: Setup,
});

function Setup() {
  const data = Route.useLoaderData();
  const { locale } = useI18n();
  const t = dashCopy[locale];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [error, setError] = useState<"required" | "tooLong" | "failed" | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data.destination) return <WorkspacePlaceholder kind="setup" companyName={null} error />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = companySchema.safeParse({ name, currency });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message === "tooLong" ? "tooLong" : "required"); return; }
    setBusy(true); setError(null);
    const { error: rpcError } = await supabase.rpc("create_company", { _name: parsed.data.name, _primary_currency: parsed.data.currency });
    if (rpcError) { setError("failed"); setBusy(false); return; }
    await queryClient.invalidateQueries({ queryKey: ["company-access"] });
    navigate({ to: "/dashboard", replace: true });
  }

  return <AuthShell title={t.setupTitle} description={t.setupDescription}>
    <form onSubmit={submit} noValidate className="space-y-5" aria-busy={busy}>
      <div>
        <label htmlFor="company-name" className="mb-2 block text-sm font-semibold text-navy">{t.companyName}</label>
        <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required disabled={busy} aria-invalid={error === "required" || error === "tooLong"} aria-describedby={error ? "company-error" : undefined} className="h-12 bg-card" />
      </div>
      <div>
        <label htmlFor="company-currency" className="mb-2 block text-sm font-semibold text-navy">{t.currency}</label>
        <select id="company-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={busy} dir="ltr" className="h-12 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {error && <p id="company-error" role="alert" className="text-sm text-negative">{t[error]}</p>}
      <Button type="submit" size="lg" disabled={busy} className="h-12 w-full bg-steel text-on-navy hover:bg-steel/90">{busy && <LoaderCircle className="animate-spin" />}{busy ? t.processing : t.create}</Button>
    </form>
  </AuthShell>;
}
