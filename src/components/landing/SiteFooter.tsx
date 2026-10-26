import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/lib/i18n/I18nProvider";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { SECTION_IDS } from "./SiteHeader";

export function SiteFooter() {
  const { t } = useI18n();
  const year = 2026;

  const columns = [
    {
      title: t.footer.product,
      links: [
        { href: `#${SECTION_IDS.features}`, label: t.nav.features },
        { href: `#${SECTION_IDS.howItWorks}`, label: t.nav.howItWorks },
      ],
    },
    {
      title: t.footer.company,
      links: [{ href: `#${SECTION_IDS.about}`, label: t.nav.about }],
    },
  ];

  return (
    <footer className="border-t border-border bg-warm">
      <div className="container-page grid gap-10 py-12 sm:py-16 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))_auto]">
        <div className="flex flex-col items-start gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t.brand.tagline}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h2 className="font-sans text-sm font-semibold text-navy">{col.title}</h2>
            <ul className="flex flex-col gap-1">
              {col.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-navy"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col items-start gap-3">
          <h2 className="font-sans text-sm font-semibold text-navy">{t.nav.language}</h2>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <span className="num">{year}</span> AI CFO. {t.footer.rights}
          </p>
          <p className="max-w-xl">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
