import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { authCopy, type AuthMessage } from "@/lib/auth/copy";
import { authErrorKey, formSchema, type AuthMode } from "@/lib/auth/rules";
import { AuthShell } from "./AuthShell";

export function AuthForm({ mode, resetSuccess = false }: { mode: AuthMode; resetSuccess?: boolean }) {
  const { locale } = useI18n(); const t = authCopy[locale];
  const { user, ready, recovery, signOut } = useAuth(); const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, AuthMessage>>>({});
  const [message, setMessage] = useState<AuthMessage | null>(resetSuccess ? "resetSuccess" : null);
  const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false);
  const [recoveryHint, setRecoveryHint] = useState(false);
  useEffect(() => { setRecoveryHint(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"); }, []);
  useEffect(() => { if (ready && user && mode !== "reset" && !recovery && !busy) void navigate({ to: "/workspace", replace: true }); }, [user, ready, recovery, busy, mode, navigate]);
  useEffect(() => { if (ready && user && recovery && mode !== "reset") void navigate({ to: "/reset-password", replace: true }); }, [ready, user, recovery, mode, navigate]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    const result = formSchema(mode).safeParse(values);
    if (!result.success) { const next: typeof errors = {}; for (const issue of result.error.issues) { const key = issue.path[0] as keyof typeof values; if (!next[key]) next[key] = issue.message as AuthMessage; } setErrors(next); return; }
    setErrors({}); setMessage(null); setBusy(true); setFailed(false);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: result.data.email, password: result.data.password }); if (error) throw error;
        await navigate({ to: "/workspace", replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: result.data.email, password: result.data.password, options: { data: { full_name: result.data.name }, emailRedirectTo: window.location.origin } }); if (error) throw error;
        setValues((current) => ({ ...current, password: "", confirm: "" }));
        if (data.session) await navigate({ to: "/workspace", replace: true }); else setMessage("confirmEmail");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setMessage("recoverySent");
      } else {
        const { data: verified, error: verifyError } = await supabase.auth.getUser();
        if (verifyError || !verified.user || !(recovery || recoveryHint)) { setMessage("invalidRecovery"); setFailed(true); return; }
        const { error } = await supabase.auth.updateUser({ password: result.data.password }); if (error) throw error;
        setValues((current) => ({ ...current, password: "", confirm: "" }));
        setMessage("resetSuccess");
        await signOut(); await navigate({ to: "/auth", search: { reset: true }, replace: true });
      }
    } catch (error) { setFailed(true); setMessage(authErrorKey(error as { code?: string; status?: number })); }
    finally { setBusy(false); }
  }
  const fields: (keyof typeof values)[] = mode === "signup" ? ["name", "email", "password", "confirm"] : mode === "reset" ? ["password", "confirm"] : mode === "forgot" ? ["email"] : ["email", "password"];
  const invalidReset = mode === "reset" && ready && (!user || !(recovery || recoveryHint));
  const action = mode === "signup" ? t.signUp : mode === "forgot" ? t.sendReset : mode === "reset" ? t.savePassword : t.signIn;
  return <AuthShell title={t[mode]} description={t[`${mode}Description`]}>
    {message && <p role={failed ? "alert" : "status"} className={`mb-6 rounded-md border p-4 text-sm leading-6 ${failed ? "border-negative/30 bg-negative-soft text-negative" : "border-positive/30 bg-positive-soft text-foreground"}`}>{t[message]}</p>}
    {invalidReset ? <div><p role="alert" className="mb-5 text-sm text-negative">{t.invalidRecovery}</p><Button asChild variant="subtle"><Link to="/forgot-password">{t.sendReset}</Link></Button></div> : <form onSubmit={submit} noValidate className="space-y-5" aria-busy={busy}>
      {fields.map((field) => { const secret = field === "password" || field === "confirm"; const label = field === "password" && mode === "reset" ? t.newPassword : t[field]; return <div key={field}>
        <label htmlFor={`auth-${field}`} className="mb-2 block text-sm font-semibold text-navy">{label}</label>
        <div className="relative"><Input id={`auth-${field}`} name={field} type={secret ? visible[field] ? "text" : "password" : field === "email" ? "email" : "text"} value={values[field]} onChange={(e) => setValues((current) => ({ ...current, [field]: e.target.value }))} autoComplete={secret ? mode === "login" ? "current-password" : "new-password" : field === "name" ? "name" : "email"} dir={field === "email" || secret ? "ltr" : undefined} maxLength={field === "email" ? 255 : field === "name" ? 100 : 128} placeholder={field === "name" ? t.namePlaceholder : field === "email" ? t.emailPlaceholder : undefined} required disabled={busy} aria-invalid={Boolean(errors[field])} aria-describedby={[errors[field] ? `${field}-error` : "", field === "password" && mode !== "login" ? "password-requirements" : ""].filter(Boolean).join(" ") || undefined} className={`h-12 bg-card ${secret ? "pe-14 rtl:pe-3 rtl:ps-14" : ""}`} />
          {secret && <Button type="button" variant="ghost" size="icon" disabled={busy} className="absolute end-0 top-0 h-12 w-12" aria-label={`${visible[field] ? t.hide : t.show}: ${label}`} title={visible[field] ? t.hide : t.show} onClick={() => setVisible((current) => ({ ...current, [field]: !current[field] }))}>{visible[field] ? <EyeOff /> : <Eye />}</Button>}
        </div>
        {errors[field] && <p id={`${field}-error`} role="alert" className="mt-2 text-sm text-negative">{t[errors[field]]}</p>}
        {field === "password" && mode !== "login" && <p id="password-requirements" className="mt-2 text-xs leading-5 text-muted-foreground">{t.requirements}</p>}
      </div>; })}
      {mode === "login" && <div className="text-end"><Link to="/forgot-password" className="text-sm text-steel underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-ring">{t.forgotLink}</Link></div>}
      <Button type="submit" size="lg" disabled={busy || (mode === "reset" && !ready)} className="h-12 w-full bg-steel text-on-navy hover:bg-steel/90">{busy && <LoaderCircle className="animate-spin" />}{busy ? t.processing : action}</Button>
    </form>}
    <div className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? <>{t.noAccount} <Link to="/signup" className="font-semibold text-steel hover:underline">{t.signUp}</Link></> : mode === "signup" ? <>{t.haveAccount} <Link to="/auth" className="font-semibold text-steel hover:underline">{t.signIn}</Link></> : <Link to="/auth" className="font-semibold text-steel hover:underline">{t.loginLink}</Link>}</div>
  </AuthShell>;
}