import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError, PageHeader, PageNotFound, Panel, selectClass } from "@/components/app/ui";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { authHead } from "@/lib/auth/head";
import { CURRENCIES } from "@/lib/auth/rules";
import { useAppCopy, useCompany } from "@/lib/company/use-company";

export const Route = createFileRoute("/_authenticated/_company/settings")({
  head: () => authHead("Settings", "Company, language and account settings."),
  component: Settings,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

function Settings() {
  const { t } = useAppCopy();
  const { company } = useCompany();
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const admin = company.role === "owner" || company.role === "admin";
  const [name, setName] = useState(company.name);
  const [currency, setCurrency] = useState(company.currency);
  const [status, setStatus] = useState<"saved" | "failed" | null>(null);
  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 120) { setStatus("failed"); return; }
    const { error } = await supabase.from("companies").update({ name: trimmed, primary_currency: currency }).eq("id", company.id);
    setStatus(error ? "failed" : "saved");
    if (!error) await qc.invalidateQueries({ queryKey: ["company-access"] });
  }
  return <>
    <PageHeader title={t.nav.settings} />
    <Panel title={t.companySection}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-navy">{t.companyName}<Input className="mt-1.5" value={name} maxLength={120} disabled={!admin} onChange={(e) => setName(e.target.value)} /></label>
        <label className="text-sm font-semibold text-navy">{t.currency}<select dir="ltr" className={selectClass + " mt-1.5 w-full"} value={currency} disabled={!admin} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      {admin ? <Button className="mt-4 bg-steel text-on-navy hover:bg-steel/90" onClick={() => void save()}>{t.save}</Button> : <p className="mt-3 text-sm text-muted-foreground">{t.onlyAdmins}</p>}
      {status && <p role="status" className={`mt-3 text-sm ${status === "saved" ? "text-positive" : "text-negative"}`}>{status === "saved" ? t.saved : t.failed}</p>}
    </Panel>
    <Panel title={t.languageSection}><LanguageSwitcher /></Panel>
    <Panel title={t.accountSection}>
      <p className="text-sm text-muted-foreground">{t.email}: <span dir="ltr" className="text-navy">{user?.email}</span></p>
      <div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="subtle"><Link to="/forgot-password">{t.changePassword}</Link></Button><Button variant="subtle" onClick={() => void signOut()}>{t.logout}</Button></div>
    </Panel>
  </>;
}
