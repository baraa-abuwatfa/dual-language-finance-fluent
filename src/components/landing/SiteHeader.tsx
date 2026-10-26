import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { useComingSoon } from "./use-coming-soon";

export const SECTION_IDS = {
  features: "features",
  howItWorks: "how-it-works",
  about: "about",
} as const;

export function SiteHeader() {
  const { t } = useI18n();
  const comingSoon = useComingSoon();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const links = [
    { href: `#${SECTION_IDS.features}`, label: t.nav.features },
    { href: `#${SECTION_IDS.howItWorks}`, label: t.nav.howItWorks },
    { href: `#${SECTION_IDS.about}`, label: t.nav.about },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-border bg-background/90 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
        <a href="#top" className="min-w-0 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
          <span className="sr-only">{t.brand.name}</span>
        </a>

        <nav aria-label={t.nav.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Button asChild variant="nav" size="sm">
                  <a href={link.href}>{link.label}</a>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher compact className="hidden min-[360px]:inline-flex" />
          <Button variant="nav" className="hidden lg:inline-flex" onClick={comingSoon.login}>
            {t.nav.login}
          </Button>
          <Button variant="hero" className="hidden sm:inline-flex" onClick={comingSoon.signup}>
            {t.nav.getStarted}
          </Button>
          <Button
            variant="subtle"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      >
        <nav aria-label={t.nav.mainNav} className="container-page animate-in fade-in slide-in-from-top-2 py-4 duration-200">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-lg px-3 text-base font-medium text-navy transition-colors hover:bg-secondary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <LanguageSwitcher className="self-start min-[360px]:hidden" />
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              <Button
                variant="subtle"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  comingSoon.login();
                }}
              >
                {t.nav.login}
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  comingSoon.signup();
                }}
              >
                {t.nav.getStarted}
              </Button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
