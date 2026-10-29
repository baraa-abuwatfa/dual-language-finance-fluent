import { useState } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, Receipt, Settings, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { useI18n } from "@/lib/i18n/I18nProvider";

const NAV = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/transactions", key: "transactions", icon: Receipt },
  { to: "/invoices", key: "invoices", icon: FileText },
  { to: "/reports", key: "reports", icon: BarChart3 },
  { to: "/insights", key: "insights", icon: Sparkles },
  { to: "/settings", key: "settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useAppCopy();
  return <nav className="flex flex-col gap-1" aria-label={t.menu}>
    {NAV.map(({ to, key, icon: Icon }) => <Link key={to} to={to} onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-on-navy-muted transition-colors hover:bg-on-navy/10 hover:text-on-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne"
      activeProps={{ className: "bg-on-navy/10 !text-on-navy shadow-[inset_3px_0_0_var(--champagne)] rtl:shadow-[inset_-3px_0_0_var(--champagne)]", "aria-current": "page" }}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />{t.nav[key]}
    </Link>)}
  </nav>;
}

export function AppShell() {
  const { t } = useAppCopy();
  const { dir } = useI18n();
  const { company, companyCount } = useCompany();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  return <div dir={dir} className="min-h-screen bg-background">
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col bg-navy p-4 lg:flex">
      <Link to="/dashboard" className="mb-8 block rounded-md bg-card px-3 py-2" aria-label="AI CFO"><Logo /></Link>
      <NavLinks />
    </aside>
    {open && <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" aria-label={t.closeMenu} className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-navy p-4 motion-safe:animate-fade-up">
        <div className="mb-6 flex items-center justify-between gap-2"><span className="rounded-md bg-card px-3 py-2"><Logo /></span><Button variant="ghost" size="icon" className="text-on-navy hover:bg-on-navy/10 hover:text-on-navy" aria-label={t.closeMenu} onClick={() => setOpen(false)}><X /></Button></div>
        <NavLinks onNavigate={() => setOpen(false)} />
      </aside>
    </div>}
    <div className="lg:ps-64">
      <header className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.menu} aria-expanded={open} onClick={() => setOpen(true)}><Menu /></Button>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{company.name}</p><p className="text-xs text-muted-foreground"><span className="num">{company.currency}</span> · {t.role[company.role]}</p></div>
        <LanguageSwitcher compact />
        <DropdownMenu dir={dir}>
          <DropdownMenuTrigger asChild><Button variant="subtle" size="icon" aria-label={t.account} className="rounded-full font-semibold">{(user?.email ?? "?").slice(0, 1).toUpperCase()}</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground" dir="ltr">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/settings">{t.nav.settings}</Link></DropdownMenuItem>
            {companyCount > 1 && <DropdownMenuItem asChild><Link to="/select-company">{t.switchCompany}</Link></DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => { void signOut(); }}><LogOut className="size-4" />{t.logout}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8"><Outlet /></main>
    </div>
  </div>;
}
