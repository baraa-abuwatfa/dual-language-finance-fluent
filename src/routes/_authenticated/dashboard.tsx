import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3, LogOut, Receipt } from "lucide-react";
import { WorkspacePlaceholder } from "@/components/auth/WorkspacePlaceholder";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { getCompanyAccess } from "@/lib/auth/membership.functions";
import { authHead } from "@/lib/auth/head";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dashCopy } from "@/lib/dashboard/copy";

const accessOptions = queryOptions({ queryKey: ["company-access"], queryFn: () => getCompanyAccess() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => authHead("Dashboard", "Your AI CFO company dashboard."),
  loader: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(accessOptions);
    if (access.destination === "/company-setup") throw redirect({ to: "/company-setup", replace: true });
  },
  component: Dashboard,
  errorComponent: () => <WorkspacePlaceholder kind="workspace" companyName={null} error />,
  notFoundComponent: () => <WorkspacePlaceholder kind="workspace" companyName={null} error />,
});

function Dashboard() {
  const { data } = useSuspenseQuery(accessOptions);
  const { locale, dir } = useI18n();
  const t = dashCopy[locale];
  const { signOut } = useAuth();
  if (data.destination === "/select-company") return <WorkspacePlaceholder kind="multiple" companyName={null} error={false} />;
  if (data.destination !== "/workspace") return <WorkspacePlaceholder kind="workspace" companyName={null} error />;

  // No financial tables exist yet, so every figure shows an honest empty state.
  const kpis = [t.revenue, t.expenses, t.netProfit];
  return <div dir={dir} className="min-h-screen bg-background">
    <header className="container-page flex min-h-20 flex-wrap items-center justify-between gap-3 py-4">
      <Link to="/" aria-label="AI CFO"><Logo /></Link>
      <div className="flex items-center gap-2"><LanguageSwitcher compact /><Button variant="subtle" size="sm" onClick={() => signOut()}><LogOut />{t.logout}</Button></div>
    </header>
    <main className="container-page space-y-6 pb-16 pt-4 motion-safe:animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold text-navy sm:text-3xl">{t.dashboard}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.companyName} · <span className="num">{data.currency}</span></p>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        {kpis.map((label) => <div key={label} className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-card">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="num mt-2 text-2xl font-bold text-navy">—</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.noData}</p>
        </div>)}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Empty icon={<BarChart3 />} title={t.chartTitle} text={t.chartEmpty} />
        <Empty icon={<Receipt />} title={t.recent} text={t.recentEmpty} />
      </section>
    </main>
  </div>;
}

function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl border border-border bg-card p-5">
    <h2 className="text-base font-semibold text-navy">{title}</h2>
    <div className="mt-4 flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-champagne-soft text-steel [&_svg]:size-5" aria-hidden="true">{icon}</span>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  </div>;
}
