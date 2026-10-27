import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { authCopy } from "@/lib/auth/copy";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./AuthShell";
import { LogOut } from "lucide-react";
export function WorkspacePlaceholder({ kind, companyName, error }: { kind: "workspace" | "setup" | "multiple"; companyName: string | null; error: boolean }) {
  const { locale } = useI18n(); const t = authCopy[locale]; const { signOut } = useAuth(); const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [failed, setFailed] = useState(false);
  return <AuthShell title={t[kind]} description={error ? t.membershipError : t[`${kind}Description`]}>
    {companyName && <p className="mb-6 border-s-2 border-champagne ps-4 text-sm"><span className="text-muted-foreground">{t.company}</span><span className="mt-1 block font-semibold">{companyName}</span></p>}
    {error && <Button variant="subtle" className="mb-4" onClick={() => navigate({ to: "/dashboard", replace: true })}>{t.retry}</Button>}
    {failed && <p role="alert" className="mb-4 text-sm text-negative">{t.generic}</p>}
    <Button variant="subtle" disabled={busy} onClick={async () => { setBusy(true); try { await signOut(); } catch { setFailed(true); setBusy(false); } }}><LogOut />{busy ? t.processing : t.logout}</Button>
  </AuthShell>;
}