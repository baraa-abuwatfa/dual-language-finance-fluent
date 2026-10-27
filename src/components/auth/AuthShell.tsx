import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { authCopy } from "@/lib/auth/copy";
export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { locale, dir } = useI18n();
  const t = authCopy[locale];
  return <div dir={dir} className="min-h-screen bg-background">
    <header className="container-page flex min-h-20 flex-wrap items-center justify-between gap-3 py-4"><Link to="/" aria-label="AI CFO"><Logo /></Link><LanguageSwitcher compact /></header>
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-8 sm:pt-14 motion-safe:animate-fade-up">
      <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-champagne-soft text-steel"><ShieldCheck aria-hidden="true" className="size-6" /></div>
      <h1 className="text-3xl font-semibold tracking-normal text-navy">{title}</h1><p className="mt-3 mb-8 text-sm leading-6 text-muted-foreground">{description}</p>
      {children}
      <Button asChild variant="link" className="mt-8 px-0 text-steel"><Link to="/"><ArrowLeft className="rtl:rotate-180" />{t.back}</Link></Button>
    </main>
  </div>;
}