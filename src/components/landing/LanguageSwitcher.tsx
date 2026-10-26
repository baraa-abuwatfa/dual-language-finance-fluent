import { Languages } from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { LOCALES, LOCALE_META } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const COMPACT_LABEL = { en: "EN", ar: "عربي" } as const;

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn("inline-flex items-center gap-1 rounded-full border border-cloud bg-card p-1 shadow-sm", className)}
    >
      {!compact && <Languages className="mx-1.5 h-4 w-4 text-steel" aria-hidden="true" />}
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            dir={LOCALE_META[code].dir}
            aria-pressed={active}
            aria-label={LOCALE_META[code].nativeName}
            onClick={() => setLocale(code)}
            className={cn(
              "min-h-9 min-w-11 cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-navy text-on-navy shadow-sm" : "text-steel hover:bg-secondary hover:text-navy",
            )}
          >
            {compact ? COMPACT_LABEL[code] : LOCALE_META[code].nativeName}
          </button>
        );
      })}
    </div>
  );
}
