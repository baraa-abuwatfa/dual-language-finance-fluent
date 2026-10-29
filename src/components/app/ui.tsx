import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dashCopy } from "@/lib/dashboard/copy";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, action }: { title: string; description?: string | undefined; action?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0"><h1 className="font-display text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("min-w-0 rounded-xl border border-border bg-card p-4 shadow-[0_1px_0_var(--border)] transition-shadow duration-300 hover:shadow-card sm:p-5", className)}>
    {(title || action) && <div className="mb-4 flex items-center justify-between gap-2">{title && <h2 className="text-base font-semibold text-navy">{title}</h2>}{action}</div>}
    {children}
  </section>;
}

export function EmptyState({ text, icon, action }: { text: string; icon?: ReactNode; action?: ReactNode }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background p-6 text-center">
    <span className="flex size-10 items-center justify-center rounded-lg bg-champagne-soft text-steel [&_svg]:size-5" aria-hidden="true">{icon ?? <Inbox />}</span>
    <p className="max-w-xs text-sm text-muted-foreground">{text}</p>{action}
  </div>;
}

export function StatCard({ label, value, caption, tone = "neutral", icon }: { label: string; value: string; caption: string; tone?: "neutral" | "positive" | "negative"; icon: ReactNode }) {
  return <div className="group relative min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card motion-safe:animate-fade-up">
    <div className="pointer-events-none absolute -end-6 -top-6 size-20 rounded-full bg-champagne-soft opacity-70" aria-hidden="true" />
    <div className="relative flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-muted-foreground">{label}</p><span className="text-steel [&_svg]:size-4" aria-hidden="true">{icon}</span></div>
    <p className={cn("num relative mt-2 truncate text-start text-xl font-bold sm:text-2xl", tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-navy")}>{value}</p>
    <p className="relative mt-1 text-xs text-muted-foreground">{caption}</p>
  </div>;
}

export function PageError() {
  const router = useRouter(); const { reset } = useQueryErrorResetBoundary(); const { locale } = useI18n(); const t = dashCopy[locale];
  return <div role="alert" className="mx-auto max-w-md p-8 text-center"><p className="text-sm text-negative">{t.loadError}</p><Button variant="subtle" className="mt-4" onClick={() => { reset(); void router.invalidate(); }}>{t.retry}</Button></div>;
}
export function PageNotFound() { const { locale } = useI18n(); return <p className="p-8 text-center text-sm text-muted-foreground">{dashCopy[locale].notFound}</p>; }

export const selectClass = "h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
